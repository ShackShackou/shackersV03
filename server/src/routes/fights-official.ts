/**
 * OFFICIAL LABRUTE FIGHT GENERATION ROUTE
 * Uses the REAL LaBrute engine for 100% faithful combat
 */

import { Router } from 'express';
import { generateOfficialFight } from '../engine/OfficialFightGenerator';
const FightManager = require('../../combat/FightManager');

const fightManager = new FightManager();

const router = Router();

/**
 * Generate a fight using the official LaBrute engine
 * POST /api/fights/generate-official
 */
router.post('/generate-official', async (req, res) => {
  try {
    console.log('🎮 OFFICIAL ENGINE: Fight generation requested');

    const { fighter1, fighter2, seed } = req.body;

    if (!fighter1 || !fighter2) {
      return res.status(400).json({
        error: 'Both fighters are required'
      });
    }

    // Generate fight with official engine
    const fightResult = await generateOfficialFight(fighter1, fighter2, seed);

    // Store seed and RNG sequence for later verification
    fightManager.activeFights.set(fightResult.fightId, {
      fighters: fightResult.fighters,
      steps: fightResult.steps,
      seed: fightResult.seed,
      rng: fightResult.rng,
      timestamp: Date.now(),
      validated: false,
    });

    console.log('✅ OFFICIAL ENGINE: Fight generated successfully', {
      steps: fightResult.steps.length,
      winner: fightResult.winner.name,
      loser: fightResult.loser.name,
    });

    res.json(fightResult);

  } catch (error) {
    console.error('❌ OFFICIAL ENGINE: Fight generation failed:', error);
    res.status(500).json({
      error: 'Failed to generate fight',
      details: error.message
    });
  }
});

/**
 * Validate a fight result (anti-cheat)
 * POST /api/fights/validate-official
 */
router.post('/validate-official', async (req, res) => {
  try {
    const { fightId, result } = req.body;

    const stored = fightManager.activeFights.get(fightId);
    if (!stored) {
      return res.status(404).json({ error: 'Fight not found or expired' });
    }

    // Re-generate fight with stored seed and fighters
    const serverResult = await generateOfficialFight(
      stored.fighters[0],
      stored.fighters[1],
      stored.seed
    );

    // Compare steps length
    if (serverResult.steps.length !== result.steps.length) {
      return res.status(400).json({ error: 'Step count mismatch' });
    }

    for (let i = 0; i < serverResult.steps.length; i++) {
      const a = serverResult.steps[i];
      const b = result.steps[i];
      if (JSON.stringify(a) !== JSON.stringify(b)) {
        return res.status(400).json({ error: `Step ${i} mismatch`, expected: a, got: b });
      }
    }

    for (let i = 0; i < serverResult.fighters.length; i++) {
      if (serverResult.fighters[i].hp !== result.fighters[i].hp) {
        return res.status(400).json({ error: `HP mismatch for fighter ${i}` });
      }
    }

    stored.validated = true;

    res.json({
      valid: true,
      fightId,
    });

  } catch (error) {
    console.error('Fight validation error:', error);
    res.status(500).json({
      error: 'Failed to validate fight'
    });
  }
});

export default router;
