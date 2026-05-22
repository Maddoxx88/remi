import { Router, Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { enrichProcessedDump, PROCESS_SYSTEM_PROMPT_EXTENSION } from '../lib/taskMeta';

const router = Router();

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not set');
  }
  return new Anthropic({ apiKey });
}

const SYSTEM_PROMPT = `You are Remi, an AI thought partner. Your job is to take someone's raw, unfiltered brain dump — messy thoughts, worries, tasks, ideas — and transform it into a clean, structured, actionable output.

You MUST respond with ONLY a valid JSON object, no markdown, no explanation, nothing else. The JSON must follow this exact structure:

{
  "summary": "1-2 sentence overview of what's on their mind",
  "mood": "one of: focused | overwhelmed | anxious | energized | scattered | reflective | stressed | creative",
  "focusItem": {
    "title": "The single most important thing to do right now",
    "reason": "Why this is the top priority in one sentence"
  },
  "tasks": [
    {
      "id": "unique-id-1",
      "title": "Task title",
      "category": "one of: work | personal | health | finance | creative | social | admin",
      "priority": "high | medium | low",
      "estimatedMinutes": 30,
      "notes": "optional clarifying note or null",
      "dueDate": "YYYY-MM-DD or null",
      "dueLabel": "human-readable due phrase or null",
      "project": "project or context tag or null",
      "actionType": "email | call | meet | buy | review | submit | plan | remind | write | schedule | other",
      "actionVerb": "triggering verb/phrase or null"
    }
  ],
  "insights": [
    "One pattern or observation about their mental state or workload",
    "Another insight if relevant"
  ]
}

${PROCESS_SYSTEM_PROMPT_EXTENSION}

Rules:
- Extract ALL tasks mentioned, even implicitly (e.g. "remind me tomorrow to email Sarah about budget" is one task with due tomorrow, Finance project, email action)
- Be empathetic but direct
- estimatedMinutes should be realistic (5–240)
- Maximum 6 tasks, prioritize ruthlessly
- insights should feel personal and perceptive, not generic
- If the dump is very short, still do your best`;

router.post('/', async (req: Request, res: Response) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text is required' });
    }

    if (text.length > 5000) {
      return res.status(400).json({ error: 'Text too long. Max 5000 characters.' });
    }

    const today = new Date();
    const todayISO = today.toISOString().slice(0, 10);

    console.log(`[process] ${text.trim().length} chars → Anthropic`);

    const model = process.env.ANTHROPIC_MODEL?.trim() || 'claude-sonnet-4-6';

    const message = await getClient().messages.create({
      model,
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Today's date: ${todayISO} (${today.toLocaleDateString('en-US', { weekday: 'long' })})\n\nHere's my brain dump:\n\n${text.trim()}`,
        },
      ],
    });

    const rawContent = message.content[0];
    if (rawContent.type !== 'text') {
      return res.status(500).json({ error: 'Unexpected response type from AI' });
    }

    const cleanedText = rawContent.text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(cleanedText);
    } catch {
      console.error('Failed to parse AI response:', rawContent.text);
      return res.status(500).json({ error: 'Failed to parse AI response' });
    }

    const data = enrichProcessedDump(parsed, text.trim(), today);

    console.log(`[process] done — ${data.tasks.length} tasks, mood: ${data.mood}`);

    return res.json({
      success: true,
      data,
      processedAt: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('Process error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({ error: message });
  }
});

export default router;
