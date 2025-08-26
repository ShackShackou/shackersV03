/**
 * FightManager
 * High-level wrapper around the authoritative LaBruteEngine.
 * Handles seeding, fight storage and validation while delegating
 * actual combat calculations to LaBruteEngine.
 */

const { LaBruteEngine } = require('./LaBruteEngine');

class FightManager {
  constructor() {
    this.activeFights = new Map();
  }

  /**
   * Generate a fight using the authentic LaBrute engine
   * @param {Object} brute1
   * @param {Object} brute2
   * @param {number} seed - deterministic seed
   */
  generateFight(brute1, brute2, seed = Date.now()) {
    const random = this.seedRandom(seed);
    const engine = new LaBruteEngine(random);
    const result = engine.generateFight(brute1, brute2);

    const fightId = `${brute1.id}_${brute2.id}_${seed}`;
    this.activeFights.set(fightId, {
      ...result,
      seed,
      timestamp: Date.now(),
      validated: false,
    });

    return {
      fightId,
      seed,
      steps: result.steps,
      fighters: result.fighters,
      winner: result.winner,
      loser: result.loser,
    };
  }

  /** Validate a fight result (anti-cheat) */
  validateFight(fightId, userId) {
    const fight = this.activeFights.get(fightId);
    if (!fight) {
      throw new Error('Fight not found or expired');
    }

    const isValid = fight.timestamp > Date.now() - 300000; // 5 minutes
    if (isValid) {
      fight.validated = true;
      return fight;
    }
    throw new Error('Fight validation failed');
  }

  /** Cleanup expired fights */
  cleanup() {
    const now = Date.now();
    const expiredTime = 300000;
    for (const [fightId, fight] of this.activeFights.entries()) {
      if (now - fight.timestamp > expiredTime) {
        this.activeFights.delete(fightId);
      }
    }
  }

  /** Simple seeded RNG used for deterministic fights */
  seedRandom(seed) {
    return () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
  }
}

module.exports = FightManager;
