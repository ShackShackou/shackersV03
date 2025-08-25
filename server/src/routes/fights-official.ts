/**
 * OFFICIAL LABRUTE FIGHT GENERATION ROUTE
 * Uses the REAL LaBrute engine for 100% faithful combat
 */

import { Router } from 'express';
import { generateOfficialFight } from '../engine/OfficialFightGenerator';

const router = Router();

/**
 * Generate a fight using the official LaBrute engine
 * POST /api/fights/generate-official
 */
router.post('/generate-official', async (req, res) => {
  try {
    console.log('🎮 OFFICIAL ENGINE: Fight generation requested');
    
    const { fighter1, fighter2, useTrueEngine } = req.body;
    
    if (!fighter1 || !fighter2) {
      return res.status(400).json({ 
        error: 'Both fighters are required' 
      });
    }

    // Generate fight with official engine
    const fightResult = await generateOfficialFight(fighter1, fighter2);
    
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
    const { fightId, result, seed } = req.body;
    
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