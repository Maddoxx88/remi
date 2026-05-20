import { Router, Request, Response } from 'express';

const router = Router();

const MOCK_RESPONSE = {
  summary: "You're juggling a heavy workload with a looming deadline, some personal errands, and underlying stress about getting everything done.",
  mood: "overwhelmed",
  focusItem: {
    title: "Finish the project report",
    reason: "It has a hard deadline and unblocks everything else on your list."
  },
  tasks: [
    {
      id: "task-1",
      title: "Finish project report",
      category: "work",
      priority: "high",
      estimatedMinutes: 90,
      notes: "Focus on this first — it's blocking everything else."
    },
    {
      id: "task-2",
      title: "Fix the app bug",
      category: "work",
      priority: "high",
      estimatedMinutes: 45,
      notes: null
    },
    {
      id: "task-3",
      title: "Call mom",
      category: "personal",
      priority: "medium",
      estimatedMinutes: 20,
      notes: "Schedule for after work hours."
    },
    {
      id: "task-4",
      title: "Buy groceries",
      category: "personal",
      priority: "low",
      estimatedMinutes: 30,
      notes: null
    }
  ],
  insights: [
    "You're carrying both work pressure and personal obligations — try to timebox personal tasks so they don't bleed into focus time.",
    "The deadline anxiety is valid, but breaking the report into smaller chunks will make it feel more manageable."
  ]
};

router.post('/', async (req: Request, res: Response) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Simulate a realistic API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    return res.json({
      success: true,
      data: MOCK_RESPONSE,
      processedAt: new Date().toISOString()
    });

  } catch (error: unknown) {
    console.error('Process error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({ error: message });
  }
});

export default router;