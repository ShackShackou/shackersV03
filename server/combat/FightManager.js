// LaBrute Fight Manager - Server-side Combat Engine
// Handles all combat calculations using the official LaBrute engine
// Anti-cheat: All combat logic runs server-side only

const { StepType, randomBetween, randomItem } = require('../engine/labrute-core/constants');
const { getDamage } = require('../engine/labrute-core/getDamage');
const { getFighterStat } = require('../engine/labrute-core/getFighterStat');

class FightManager {
  constructor() {
    this.activeFights = new Map(); // Store active fights for validation
  }

  /**
   * Generate a complete fight using the official LaBrute engine
   * @param {Object} brute1 - First fighter data
   * @param {Object} brute2 - Second fighter data  
   * @param {number} seed - Random seed for deterministic fights
   * @returns {Object} Fight result with steps for client animation
   */
  generateFight(brute1, brute2, seed = Date.now()) {
    // Set deterministic seed for reproducible fights
    const originalRandom = Math.random;
    const seededRandom = this.seedRandom(seed);
    Math.random = seededRandom;

    try {
      // Convert brute data to fighter format
      const fighter1 = this.convertBruteToFighter(brute1, 'L', 0);
      const fighter2 = this.convertBruteToFighter(brute2, 'R', 1);

      // Initialize fight data structure
      const fightData = {
        fighters: [fighter1, fighter2],
        initialFighters: JSON.parse(JSON.stringify([fighter1, fighter2])),
        steps: [],
        initiative: 0,
        winner: null,
        loser: null,
        overtime: false,
        modifiers: [] // Can be extended for tournament modifiers
      };

      // Add arrival steps
      fightData.fighters.forEach(fighter => {
        fightData.steps.push({
          a: StepType.Arrive,
          f: fighter.index
        });
      });

      // Main combat loop
      let turn = 0;
      const maxTurns = 2000;

      while (!fightData.loser && turn < maxTurns) {
        // Order fighters by initiative
        this.orderFighters(fightData);

        const currentFighter = fightData.fighters[0];
        if (!currentFighter) break;

        // Set current initiative
        fightData.initiative = currentFighter.initiative;

        // Set overtime after 1000 turns
        if (turn > 1000) {
          fightData.overtime = true;
        }

        // Execute fighter turn
        this.playFighterTurn(fightData);

        // Check for deaths
        this.checkDeaths(fightData);

        turn++;
      }

      // Determine winner and loser
      const result = this.finalizeFight(fightData);

      // Store fight for validation
      const fightId = `${brute1.id}_${brute2.id}_${seed}`;
      this.activeFights.set(fightId, {
        ...result,
        timestamp: Date.now(),
        validated: false
      });

      return {
        fightId,
        steps: result.steps,
        fighters: result.fighters,
        winner: result.winner,
        loser: result.loser,
        seed: seed
      };

    } catch (error) {
      console.error('Fight generation error:', error);
      throw new Error('Combat calculation failed');
    } finally {
      Math.random = originalRandom;
    }
  }

  /**
   * Convert brute data to fighter format for combat engine
   */
  convertBruteToFighter(brute, team, index) {
    return {
      id: brute.id,
      index: index,
      team: team,
      name: brute.name,
      type: 'brute',
      level: brute.level || 1,
      
      // Core stats
      strength: brute.strength || 3,
      agility: brute.agility || 3, 
      speed: brute.speed || 3,
      hp: brute.hp || 27,
      maxHp: brute.hp || 27,
      
      // Combat stats (calculated from skills/weapons)
      baseDamage: 5,
      accuracy: brute.accuracy || 0,
      block: brute.block || 0,
      combo: brute.combo || 0,
      counter: brute.counter || 0,
      critical: brute.critical || 0,
      criticalDamage: brute.criticalDamage || 1.5,
      deflect: brute.deflect || 0,
      disarm: brute.disarm || 0,
      evasion: brute.evasion || 0,
      reversal: brute.reversal || 0,
      reach: brute.reach || 0,
      armor: brute.armor || 0,
      tempo: 1.0,
      hitSpeed: 0,
      
      // Combat state
      initiative: randomBetween(0, 100),
      activeWeapon: null,
      activeSkills: [],
      weapons: brute.weapons || [],
      skills: brute.skills || [],
      trapped: false,
      stunned: false,
      poisonedBy: null,
      hypnotized: false,
      
      // Combat flags
      bareHandHit: false,
      keepWeaponChance: 0.5,
      hitBy: {},
      
      // Visual data
      gender: brute.gender || 'male',
      body: brute.body || {},
      colors: brute.colors || {},
      rank: brute.rank || 0
    };
  }

  /**
   * Order fighters by initiative with random tiebreaker
   */
  orderFighters(fightData) {
    fightData.fighters.sort((a, b) => {
      // Dead fighters last
      if (a.hp <= 0) return 1;
      if (b.hp <= 0) return -1;
      
      // Stunned fighters last
      if (a.stunned) return 1;
      if (b.stunned) return -1;
      
      // Random tiebreaker for equal initiative
      if (a.initiative === b.initiative) {
        return Math.random() > 0.5 ? 1 : -1;
      }
      
      // Lower initiative goes first
      return a.initiative - b.initiative;
    });
  }

  /**
   * Execute a single fighter turn (simplified version)
   */
  playFighterTurn(fightData) {
    const fighter = fightData.fighters[0];
    if (!fighter || fighter.hp <= 0) return;

    // Get random opponent
    const opponents = fightData.fighters.filter(f => 
      f.team !== fighter.team && f.hp > 0
    );
    
    if (!opponents.length) return;
    
    const opponent = randomItem(opponents);
    
    // Simple attack logic for MVP
    this.executeAttack(fightData, fighter, opponent);
    
    // Increase fighter initiative for next turn
    fighter.initiative += 1 + Math.random() * 0.5;
  }

  /**
   * Execute attack between fighter and opponent
   */
  executeAttack(fightData, fighter, opponent) {
    // Add move step
    fightData.steps.push({
      a: StepType.Arrive,
      f: fighter.index,
      // Initial HP values
      hp1: fightData.fighters[0].hp,
      hp2: fightData.fighters[1].hp
    });

    // Calculate damage
    const damageResult = getDamage(fighter, opponent);
    const damage = damageResult.damage;
    const criticalHit = damageResult.criticalHit;

    // Check evasion (simplified)
    if (Math.random() < 0.1) {
      fightData.steps.push({
        a: StepType.Evade,
        f: opponent.index
      });
      
      // Move back without damage
      fightData.steps.push({
        a: StepType.MoveBack,
        f: fighter.index
      });
      return;
    }

    // Apply damage
    opponent.hp = Math.max(0, opponent.hp - damage);

    // Add hit step with HP values for synchronization
    const hitStep = {
      a: StepType.Hit,
      f: fighter.index,
      t: opponent.index,
      d: damage,
      // Include current HP values to prevent desync
      hp1: fighter.index === 0 ? fighter.hp : opponent.hp,
      hp2: fighter.index === 1 ? fighter.hp : opponent.hp
    };
    
    if (criticalHit) {
      hitStep.c = 1;
    }
    
    fightData.steps.push(hitStep);

    // Move back
    fightData.steps.push({
      a: StepType.MoveBack,
      f: fighter.index
    });
  }

  /**
   * Check for fighter deaths and update fight state
   */
  checkDeaths(fightData) {
    fightData.fighters.forEach(fighter => {
      if (fighter.hp <= 0 && !fighter.isDead) {
        fighter.isDead = true;
        
        fightData.steps.push({
          a: StepType.Death,
          f: fighter.index,
          // Include current HP values for synchronization
          hp1: fightData.fighters[0].hp,
          hp2: fightData.fighters[1].hp
        });

        // Check if this determines the fight outcome
        const aliveFighters = fightData.fighters.filter(f => 
          f.team === fighter.team && f.hp > 0
        );
        
        if (aliveFighters.length === 0 && !fightData.loser) {
          fightData.loser = fighter.id;
        }
      }
    });
  }

  /**
   * Finalize fight result
   */
  finalizeFight(fightData) {
    if (!fightData.loser) {
      throw new Error('Fight did not complete properly');
    }

    // Find winner
    const loserFighter = fightData.fighters.find(f => f.id === fightData.loser);
    const winnerTeam = loserFighter.team === 'L' ? 'R' : 'L';
    const winnerFighter = fightData.fighters.find(f => f.team === winnerTeam);

    fightData.winner = winnerFighter.id;

    // Add end step
    fightData.steps.push({
      a: StepType.End,
      w: winnerFighter.index,
      l: loserFighter.index,
      // Final HP values
      hp1: fightData.fighters[0].hp,
      hp2: fightData.fighters[1].hp
    });

    return {
      steps: fightData.steps,
      fighters: fightData.initialFighters,
      winner: winnerFighter.name,
      loser: loserFighter.name
    };
  }

  /**
   * Validate a fight result (anti-cheat)
   */
  validateFight(fightId, userId) {
    const fight = this.activeFights.get(fightId);
    if (!fight) {
      throw new Error('Fight not found or expired');
    }

    // Additional validation logic here
    const isValid = fight.timestamp > Date.now() - 300000; // 5 minute expiry
    
    if (isValid) {
      fight.validated = true;
      return fight;
    }

    throw new Error('Fight validation failed');
  }

  /**
   * Clean up expired fights
   */
  cleanup() {
    const now = Date.now();
    const expiredTime = 300000; // 5 minutes

    for (const [fightId, fight] of this.activeFights.entries()) {
      if (now - fight.timestamp > expiredTime) {
        this.activeFights.delete(fightId);
      }
    }
  }

  /**
   * Simple seeded random number generator for deterministic fights
   */
  seedRandom(seed) {
    return function() {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
  }
}

module.exports = FightManager;