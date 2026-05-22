import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import processRoute from './routes/process';
import processMockRoute from './routes/process_old';
import transcribeRoute from './routes/transcribe';
import { apiLimiter, processLimiter, transcribeLimiter } from './middleware/rateLimit';

const app = express();
const PORT = process.env.PORT || 3001;

const behindProxy =
  process.env.TRUST_PROXY === '1' ||
  Boolean(process.env.RENDER) ||
  Boolean(process.env.RAILWAY_ENVIRONMENT);
if (behindProxy) {
  app.set('trust proxy', 1);
}

app.use(cors());
app.use(express.json({ limit: '50mb' })); // larger limit for audio

app.use('/api', apiLimiter);

// Routes — use Claude when API key is set, otherwise meta-aware mock parser
const useAnthropic = Boolean(process.env.ANTHROPIC_API_KEY?.trim());
app.use('/api/process', processLimiter, useAnthropic ? processRoute : processMockRoute);
app.use('/api/transcribe', transcribeLimiter, transcribeRoute);

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'Remi Backend',
    processMode: useAnthropic ? 'anthropic' : 'mock',
    anthropicKeySet: useAnthropic,
  });
});

app.listen(PORT, () => {
  console.log(`🧠 Remi backend running on http://localhost:${PORT}`);
  console.log(`   Process route: ${useAnthropic ? 'Claude (Anthropic)' : 'mock parser'}`);
});

export default app;