import {
  enrichProcessedDump,
  inferActionType,
  inferProject,
  parseDueFromText,
  ProcessedDumpPayload,
} from './taskMeta';
import type { PreviousDumpItem } from './previousContext';

/** Build a plausible mock dump from user text for dev without an API key. */
export function buildMockFromText(
  text: string,
  previousContext: PreviousDumpItem[] = [],
): ProcessedDumpPayload {
  const trimmed = text.trim();
  const due = parseDueFromText(trimmed);
  const { actionType, actionVerb } = inferActionType(trimmed);
  const project = inferProject(trimmed);

  const sentences = trimmed
    .split(/[.!?\n]+/)
    .map(s => s.trim())
    .filter(s => s.length > 8);

  const taskLike = sentences.filter(s =>
    /\b(need to|have to|must|should|remind|email|call|buy|finish|submit|schedule|meet|tomorrow|today)\b/i.test(s),
  );

  const primary = taskLike[0] ?? trimmed.slice(0, 120);

  let title = primary;
  if (actionType === 'email' && /email/i.test(primary)) {
    const who = primary.match(/\bemail\s+(\w+)/i);
    const aboutTopic = primary.match(/\babout\s+(?:the\s+)?(\w+)/i);
    const topic = aboutTopic ? aboutTopic[1] : project?.toLowerCase();
    title = who
      ? `Email ${who[1]}${topic ? ` about ${topic}` : ''}`
      : 'Send email';
  } else if (actionType === 'remind') {
    title = primary.replace(/^remind me\s+(to\s+)?/i, '').trim() || primary;
    title = title.charAt(0).toUpperCase() + title.slice(1);
  }

  const tasks = [
    {
      id: 'task-1',
      title: title.length > 80 ? title.slice(0, 77) + '...' : title,
      category: project === 'Finance' ? 'finance' : project === 'Health' ? 'health' : 'work',
      priority: due ? 'high' : 'medium',
      estimatedMinutes: actionType === 'email' ? 15 : 30,
      notes: null,
      dueDate: due?.dueDate ?? null,
      dueLabel: due?.dueLabel ?? null,
      project,
      actionType,
      actionVerb,
    },
  ];

  if (taskLike.length > 1) {
    const second = taskLike[1];
    const meta2 = inferActionType(second);
    const due2 = parseDueFromText(second);
    tasks.push({
      id: 'task-2',
      title: second.length > 80 ? second.slice(0, 77) + '...' : second,
      category: 'personal',
      priority: 'medium',
      estimatedMinutes: 20,
      notes: null,
      dueDate: due2?.dueDate ?? null,
      dueLabel: due2?.dueLabel ?? null,
      project: inferProject(second),
      actionType: meta2.actionType,
      actionVerb: meta2.actionVerb,
    });
  }

  const payload: ProcessedDumpPayload = {
    summary: `You're working through: ${trimmed.slice(0, 100)}${trimmed.length > 100 ? '...' : ''}`,
    mood: /\b(stress|overwhelm|worry|anxious)\b/i.test(trimmed) ? 'overwhelmed' : 'focused',
    focusItem: {
      title: tasks[0].title,
      reason: due
        ? `It's time-sensitive (${due.dueLabel}).`
        : 'It surfaced most clearly in your dump.',
    },
    tasks,
    insights: buildInsights(trimmed, project, previousContext),
  };

  return enrichProcessedDump(payload, trimmed);
}

function buildInsights(
  text: string,
  project: string | null,
  previousContext: PreviousDumpItem[],
): string[] {
  const insights: string[] = [];

  if (previousContext.length > 0) {
    const themes = previousContext.map(c => c.summary.toLowerCase()).join(' ');
    const repeatedStress =
      /\b(stress|deadline|overwhelm|worry|anxious)\b/i.test(themes) &&
      /\b(stress|deadline|overwhelm|worry|anxious)\b/i.test(text);

    if (repeatedStress) {
      insights.push(
        `You've been carrying stress across your last few dumps (${previousContext[0].relativeLabel} through today) — the same worries keep surfacing, so they may deserve dedicated time this week.`,
      );
    } else {
      const oldest = previousContext[previousContext.length - 1];
      insights.push(
        `Compared to ${oldest.relativeLabel} (${oldest.summary.slice(0, 60)}…), today's dump shows what's shifting on your mind — worth noticing the thread between them.`,
      );
    }
  }

  insights.push(
    'Remi inferred due dates, projects, and action types from how you phrased things.',
  );

  if (project) {
    insights.push(`Tasks cluster around "${project}" — consider batching related actions.`);
  }

  return insights.slice(0, 3);
}
