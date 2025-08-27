import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';

// Import the new FightManager for server-side combat
const FightManager = require('../../combat/FightManager');

const router = Router();
const fightManager = new FightManager();

const FightSchema = z.object({
  shackerAId: z.string(), // Accept any string for testing
  shackerBId: z.string(), // Accept any string for testing
});

// Combat generation endpoint using the official LaBrute engine
// TEMPORARILY DISABLED AUTH FOR TESTING
router.post('/', async (req: any, res) => {
  const parse = FightSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: 'Invalid body', details: parse.error.flatten() });
  }
  const { shackerAId, shackerBId } = parse.data;

  try {
    const [shackerA, shackerB] = await Promise.all([
      prisma.shacker.findUnique({ where: { id: shackerAId } }),
      prisma.shacker.findUnique({ where: { id: shackerBId } }),
    ]);
    
    if (!shackerA || !shackerB) {
      return res.status(404).json({ error: 'Shacker not found' });
    }

    // Generate fight using the official LaBrute engine (server-side only)
    const fightResult = fightManager.generateFight(shackerA, shackerB);

    // Store fight result in database
    const fight = await prisma.fight.create({
      data: {
        shackerAId,
        shackerBId,
        winnerId: fightResult.winner === shackerA.name ? shackerA.id : shackerB.id,
        log: `LaBrute Engine Fight: ${shackerA.name} vs ${shackerB.name} -> winner: ${fightResult.winner}`,
        // Store fight data for replay/validation
        fightData: JSON.stringify({
          steps: fightResult.steps,
          fighters: fightResult.fighters,
          seed: fightResult.seed
        })
      },
    });

    // Return fight steps for client animation (MMO architecture)
    return res.status(201).json({
      fight: {
        id: fight.id,
        fightId: fightResult.fightId,
        winnerId: fight.winnerId,
        winner: fightResult.winner,
        loser: fightResult.loser
      },
      // Combat data for client animation
      steps: fightResult.steps,
      fighters: fightResult.fighters,
      seed: fightResult.seed
    });

  } catch (error) {
    console.error('Fight generation error:', error);
    return res.status(500).json({ error: 'Combat calculation failed' });
  }
});

// Fight validation endpoint (anti-cheat)
router.post('/validate', requireAuth, async (req: AuthRequest, res) => {
  const { fightId, userId } = req.body;
  
  try {
    const validatedFight = fightManager.validateFight(fightId, userId);
    return res.json({ valid: true, fight: validatedFight });
  } catch (error) {
    return res.status(400).json({ valid: false, error: error.message });
  }
});

// Expose API for steps: Add endpoint to generate and return DetailedFight.steps + winner, using generateFight with seed.
router.post('/generate-steps', async (req: any, res) => {
  const { brute1, brute2 } = req.body;
  const fight = fightManager.generateFight(brute1, brute2);
  res.json({ steps: fight.steps, winner: fight.winner });
});

export default router;
