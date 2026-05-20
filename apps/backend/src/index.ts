import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import processRoute from './routes/process';
import transcribeRoute from './routes/transcribe';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' })); // larger limit for audio

// Routes
app.use('/api/process', processRoute);
app.use('/api/transcribe', transcribeRoute);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'Remi Backend' });
});

app.listen(PORT, () => {
  console.log(`🧠 Remi backend running on http://localhost:${PORT}`);
});

export default app;