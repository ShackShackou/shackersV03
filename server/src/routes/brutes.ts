import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

const CreateBruteSchema = z.object({
  name: z.string().min(3),
  gender: z.enum(['male', 'female']),
});

router.get('/', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const brutes = await prisma.brute.findMany({ where: { userId } });
  return res.json(brutes);
});

router.post('/', requireAuth, async (req: AuthRequest, res) => {
  const parse = CreateBruteSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: 'Invalid body', details: parse.error.flatten() });
  }
  const userId = req.userId!;
  const { name, gender } = parse.data;
  try {
    const brute = await prisma.brute.create({
      data: {
        name,
        gender: gender as any,
        userId,
        level: 1,
        hp: 10,
        strength: 3,
        agility: 3,
        speed: 3,
      },
    });
    return res.status(201).json(brute);
  } catch (e: any) {
    if (e?.code === 'P2002') {
      return res.status(409).json({ error: 'Name already taken' });
    }
    return res.status(500).json({ error: 'Failed to create brute' });
  }
});

export default router;
