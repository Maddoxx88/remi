import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import processRoute from './routes/process';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/process', processRoute);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'Remi Backend' });
});

app.listen(PORT, () => {
  console.log(`🧠 Remi backend running on http://localhost:${PORT}`);
});

export default app;
