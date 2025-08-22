import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

const FightSchema = z.object({
  shackerAId: z.string().uuid(),
  shackerBId: z.string().uuid(),
});

const computeScore = (b: { hp: number; strength: number; agility: number; speed: number }): number => {
  return b.hp + 2 * b.strength + b.agility + b.speed;
};

router.post('/', requireAuth, async (req: AuthRequest, res) => {
  const parse = FightSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: 'Invalid body', details: parse.error.flatten() });
  }
  const { shackerAId, shackerBId } = parse.data;

  const [shackerA, shackerB] = await Promise.all([
    prisma.shacker.findUnique({ where: { id: shackerAId } }),
    prisma.shacker.findUnique({ where: { id: shackerBId } }),
  ]);
  if (!shackerA || !shackerB) {
    return res.status(404).json({ error: 'Shacker not found' });
  }

  const scoreA = computeScore(shackerA);
  const scoreB = computeScore(shackerB);
  const winner = scoreA >= scoreB ? shackerA : shackerB;

  const log = `Fight: ${shackerA.name} (${scoreA}) vs ${shackerB.name} (${scoreB}) -> winner: ${winner.name}`;

  const fight = await prisma.fight.create({
    data: {
      shackerAId,
      shackerBId,
      winnerId: winner.id,
      log,
    },
  });

  return res.status(201).json({ fight, scoreA, scoreB, winnerId: winner.id });
});

export default router;
