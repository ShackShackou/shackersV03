import { Router } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();

router.get('/api/parts', async (_req, res) => {
  try {
    const csvPath = path.resolve(__dirname, '..', '..', 'meta', 'parts.csv');
    const csvData = await fs.promises.readFile(csvPath, 'utf-8');
    const lines = csvData.trim().split(/\r?\n/);
    const headers = (lines.shift() || '').split(',');
    const parts = lines.filter(Boolean).map((line) => {
      const values = line.split(',');
      const entry: Record<string, string> = {};
      headers.forEach((h, i) => {
        entry[h] = values[i];
      });
      return entry;
    });
    res.json(parts);
  } catch (error) {
    console.error('Failed to read parts.csv', error);
    res.status(500).json({ error: 'Could not load parts data' });
  }
});

router.post('/api/seed', (req, res) => {
  const { seed } = req.body as { seed?: unknown };
  res.json({ seed });
});

export default router;
