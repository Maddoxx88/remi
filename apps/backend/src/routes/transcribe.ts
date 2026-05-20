import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import os from 'os';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const { audio, mimeType } = req.body;

    if (!audio) {
      return res.status(400).json({ error: 'Audio data is required' });
    }

    const buffer = Buffer.from(audio, 'base64');
    const tempPath = path.join(os.tmpdir(), `remi-audio-${Date.now()}.m4a`);
    fs.writeFileSync(tempPath, buffer);

    // Build multipart form manually
    const boundary = `----FormBoundary${Date.now()}`;
    const filename = 'audio.m4a';
    const contentType = mimeType || 'audio/m4a';

    const preamble = Buffer.from(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n` +
      `Content-Type: ${contentType}\r\n\r\n`
    );
    const fileBuffer = fs.readFileSync(tempPath);
    const modelPart = Buffer.from(
      `\r\n--${boundary}\r\n` +
      `Content-Disposition: form-data; name="model"\r\n\r\n` +
      `whisper-1` +
      `\r\n--${boundary}--\r\n`
    );

    const body = Buffer.concat([preamble, fileBuffer, modelPart]);

    fs.unlinkSync(tempPath);

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length.toString(),
      },
      body: body,
    });

    const result = await response.json() as any;

    if (!response.ok) {
      console.error('Whisper error:', result);
      return res.status(500).json({ error: result?.error?.message || 'Transcription failed' });
    }

    return res.json({ success: true, text: result.text });

  } catch (error: unknown) {
    console.error('Transcribe error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({ error: message });
  }
});

export default router;