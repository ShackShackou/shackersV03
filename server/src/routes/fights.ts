import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

const FightSchema = z.object({
  bruteAId: z.string().uuid(),
  bruteBId: z.string().uuid(),
});

const computeScore = (b: { hp: number; strength: number; agility: number; speed: number }): number => {
  return b.hp + 2 * b.strength + b.agility + b.speed;
};

router.post('/', requireAuth, async (req: AuthRequest, res) => {
  const parse = FightSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: 'Invalid body', details: parse.error.flatten() });
  }
  const { bruteAId, bruteBId } = parse.data;

  const [bruteA, bruteB] = await Promise.all([
    prisma.brute.findUnique({ where: { id: bruteAId } }),
    prisma.brute.findUnique({ where: { id: bruteBId } }),
  ]);
  if (!bruteA || !bruteB) {
    return res.status(404).json({ error: 'Brute not found' });
  }

  const scoreA = computeScore(bruteA);
  const scoreB = computeScore(bruteB);
  const winner = scoreA >= scoreB ? bruteA : bruteB;

  const log = `Fight: ${bruteA.name} (${scoreA}) vs ${bruteB.name} (${scoreB}) -> winner: ${winner.name}`;

  const fight = await prisma.fight.create({
    data: {
      bruteAId,
      bruteBId,
      winnerId: winner.id,
      log,
    },
  });

  return res.status(201).json({ fight, scoreA, scoreB, winnerId: winner.id });
});

export default router;
