import { rateLimit, type Options } from 'express-rate-limit';

const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000;

const baseOptions: Partial<Options> = {
  windowMs: WINDOW_MS,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res, _next, options) => {
    const retryAfterSec = Math.ceil(options.windowMs / 1000);
    res.status(options.statusCode).json({
      error: 'Too many requests. Please wait a few minutes and try again.',
      retryAfterSec,
    });
  },
};

function createLimiter(max: number, envKey: string): ReturnType<typeof rateLimit> {
  const fromEnv = process.env[envKey];
  const parsed = fromEnv ? Number.parseInt(fromEnv, 10) : NaN;
  const limit = Number.isFinite(parsed) && parsed > 0 ? parsed : max;

  return rateLimit({
    ...baseOptions,
    limit,
  });
}

/** General cap on all /api routes (per IP) */
export const apiLimiter = createLimiter(120, 'RATE_LIMIT_API_MAX');

/** Brain-dump processing — costly LLM calls */
export const processLimiter = createLimiter(30, 'RATE_LIMIT_PROCESS_MAX');

/** Voice transcription */
export const transcribeLimiter = createLimiter(40, 'RATE_LIMIT_TRANSCRIBE_MAX');
