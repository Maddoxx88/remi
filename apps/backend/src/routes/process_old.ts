import { Router, Request, Response } from 'express';
import { buildMockFromText } from '../lib/buildMockFromText';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text is required' });
    }

    if (text.length > 5000) {
      return res.status(400).json({ error: 'Text too long. Max 5000 characters.' });
    }

    // Simulate a realistic API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const data = buildMockFromText(text.trim());

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
