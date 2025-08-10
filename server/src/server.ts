import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import authRouter from './routes/auth';
import brutesRouter from './routes/brutes';
import fightsRouter from './routes/fights';

const app = express();
app.use(cors());
// Accept JSON, urlencoded and plain text bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.text({ type: '*/*' }));
// Fallback: if body came as text and looks like JSON, parse it
app.use((req, _res, next) => {
  if (typeof req.body === 'string') {
    const trimmed = req.body.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        req.body = JSON.parse(trimmed);
      } catch {
        // keep as text
      }
    }
  }
  next();
});

app.get('/api', (_req, res) => {
  res.json({ message: 'server is running!' });
});

app.use('/api/auth', authRouter);
app.use('/api/brutes', brutesRouter);
app.use('/api/fights', fightsRouter);

// Serve static public/ from project root
const rootDir = path.resolve(__dirname, '..', '..');
const publicDir = path.join(rootDir, 'public');
app.use(express.static(publicDir));
app.get('/', (_req, res) => {
  res.sendFile(path.join(publicDir, 'api-test.html'));
});

const PORT = parseInt(process.env.PORT || '4000', 10);
app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
