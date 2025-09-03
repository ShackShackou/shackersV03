import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { generateFight } from '../engine/authFight';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

const FightSchema = z.object({
  bruteAId: z.string().uuid(),
  bruteBId: z.string().uuid(),
});

router.post('/', requireAuth, async (req: AuthRequest, res) => {
  const parse = FightSchema.extend({ seed: z.number().optional() }).safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: 'Invalid body', details: parse.error.flatten() });
  }
  const { bruteAId, bruteBId, seed } = parse.data;

  const [bruteA, bruteB] = await Promise.all([
    prisma.brute.findUnique({ where: { id: bruteAId } }),
    prisma.brute.findUnique({ where: { id: bruteBId } }),
  ]);
  if (!bruteA || !bruteB) {
    return res.status(404).json({ error: 'Brute not found' });
  }

  // Generate authentic-like seeded fight steps
  const fightData = generateFight(
    {
      id: bruteA.id, name: bruteA.name, hp: bruteA.hp, strength: bruteA.strength, agility: bruteA.agility, speed: bruteA.speed,
    },
    {
      id: bruteB.id, name: bruteB.name, hp: bruteB.hp, strength: bruteB.strength, agility: bruteB.agility, speed: bruteB.speed,
    },
    seed,
  );

  // Persist high-level + replay payloads
  const end = fightData.steps.find((s: any) => s.a === 26);
  const winnerIndex = typeof end?.w === 'number' ? end.w : (fightData.fight.fighters[0].hp > fightData.fight.fighters[1].hp ? 0 : 1);
  const winnerId = winnerIndex === 0 ? bruteA.id : bruteB.id;
  const log = `Fight(seed=${fightData.seed}) steps=${fightData.steps.length}`;
  // Create minimal record first (compatible even if Prisma client not regenerated)
  const created = await prisma.fight.create({ data: {
    bruteAId,
    bruteBId,
    winnerId,
    log,
  } });
  // Try to persist replay payloads using raw SQL to avoid client schema drift
  try {
    await prisma.$executeRawUnsafe(
      `UPDATE "Fight" SET steps = $1, fighters = $2 WHERE id = $3`,
      JSON.stringify(fightData.steps),
      JSON.stringify(fightData.fight.fighters),
      created.id,
    );
  } catch (e) {
    // Swallow to keep endpoint functional when columns are missing
    // eslint-disable-next-line no-console
    console.warn('Persisting steps/fighters failed (columns missing or migration not applied):', e);
  }

  return res.status(201).json({ id: created.id, ...fightData, winnerId });
});

export default router;
 
// Fetch a persisted fight with steps for replay
router.get('/:id', requireAuth, async (req: AuthRequest, res) => {
  const { id } = req.params as { id: string };
  if (!id) return res.status(400).json({ error: 'Missing id' });
  const fight = await prisma.fight.findUnique({ where: { id } });
  if (!fight) return res.status(404).json({ error: 'Fight not found' });
  let steps: any[] = [];
  let fighters: any[] = [];
  try { steps = fight.steps ? JSON.parse(fight.steps) : []; } catch {}
  try { fighters = fight.fighters ? JSON.parse(fight.fighters) : []; } catch {}
  return res.json({
    id: fight.id,
    winnerId: fight.winnerId,
    steps,
    fighters,
    createdAt: fight.createdAt,
  });
});
