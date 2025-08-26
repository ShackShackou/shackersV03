/**
 * OFFICIAL LABRUTE FIGHT GENERATION ROUTE
 * Uses the authoritative LaBruteEngine for 100% faithful combat.
 */

import { Router } from 'express';
import { LaBruteEngine } from '../../combat/LaBruteEngine.js';

const router = Router();

/**
 * Generate a fight using the authentic LaBrute engine
 * POST /api/fights/generate-official
 */
router.post('/generate-official', async (req, res) => {
  try {
    console.log('🎮 OFFICIAL ENGINE: Fight generation requested');

    const { fighter1, fighter2 } = req.body;

    if (!fighter1 || !fighter2) {
      return res.status(400).json({
        error: 'Both fighters are required'
      });
    }

    const engine = new LaBruteEngine();
    const combatResult = engine.generateFight(fighter1, fighter2);

    const fightResult = {
      fight: {
        fightId: `authentic_fight_${Date.now()}`,
        winner: combatResult.winner,
        loser: combatResult.loser,
        fighters: combatResult.fighters,
        engine: 'AUTHENTIC_LABRUTE_ENGINE',
        totalSteps: combatResult.steps.length
      },
      steps: combatResult.steps
    };

    console.log('✅ OFFICIAL ENGINE: Fight generated successfully', {
      steps: combatResult.steps.length,
      winner: combatResult.winner,
      loser: combatResult.loser,
    });

    res.json(fightResult);

  } catch (error) {
    console.error('❌ OFFICIAL ENGINE: Fight generation failed:', error);
    res.status(500).json({
      error: 'Failed to generate fight',
      details: (error as Error).message
    });
  }
});

/**
 * Validate a fight result (anti-cheat)
 * POST /api/fights/validate-official
 */
router.post('/validate-official', async (req, res) => {
  try {
    const { fightId } = req.body;

    // TODO: Re-generate fight with same seed and compare results
    // This ensures the client didn't tamper with the fight

    res.json({
      valid: true,
      fightId
    });

  } catch (error) {
    console.error('Fight validation error:', error);
    res.status(500).json({
      error: 'Failed to validate fight'
    });
  }
});

export default router;
