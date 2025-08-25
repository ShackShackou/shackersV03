/**
 * LABRUTE OFFICIAL ENGINE ADAPTER
 * This adapter connects the REAL LaBrute engine to your V08 renderer
 * WITHOUT modifying your visual rendering code
 * 
 * The engine calculates → This adapter translates → Your renderer animates
 */

class LaBruteOfficialAdapter {
  constructor() {
    this.currentFight = null;
    this.fighters = [];
    this.steps = [];
    this.currentStepIndex = 0;
  }

  /**
   * Initialize a fight with the official engine
   * @param {Object} fighter1 - First fighter data
   * @param {Object} fighter2 - Second fighter data
   * @returns {Object} Fight data with steps for animation
   */
  async generateFight(fighter1, fighter2) {
    try {
      // Call the server to generate fight with official engine
      const response = await fetch('http://localhost:4000/api/fights/generate-official', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fighter1: this.prepareFighterData(fighter1),
          fighter2: this.prepareFighterData(fighter2),
          useTrueEngine: true, // Force official engine
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate fight with official engine');
      }

      const fightData = await response.json();
      
      // Store fight data
      this.currentFight = fightData;
      this.fighters = fightData.fighters;
      this.steps = this.convertStepsForRenderer(fightData.steps);
      
      console.log('✅ Official LaBrute engine generated fight:', {
        steps: this.steps.length,
        winner: fightData.winner,
        loser: fightData.loser,
      });

      return {
        fighters: this.fighters,
        steps: this.steps,
        winner: fightData.winner,
        loser: fightData.loser,
      };
    } catch (error) {
      console.error('❌ Failed to generate official fight:', error);
      throw error;
    }
  }

  /**
   * Prepare fighter data for the official engine
   */
  prepareFighterData(fighter) {
    return {
      id: fighter.stats?.id || `fighter_${Date.now()}_${Math.random()}`,
      name: fighter.stats?.name || 'Fighter',
      level: fighter.stats?.level || 1,
      hp: fighter.stats?.maxHealth || 100,
      strength: fighter.stats?.strength || 10,
      agility: fighter.stats?.agility || 10,
      speed: fighter.stats?.speed || 10,
      endurance: fighter.stats?.endurance || 10,
      intelligence: fighter.stats?.intelligence || 10,
      willpower: fighter.stats?.willpower || 10,
      weapons: fighter.weapons || [],
      skills: fighter.skills || [],
      pets: fighter.pet ? [fighter.pet] : [],
    };
  }

  /**
   * Convert official engine steps to renderer-compatible format
   * This is the CRITICAL function that preserves your rendering
   */
  convertStepsForRenderer(officialSteps) {
    const rendererSteps = [];
    
    for (const step of officialSteps) {
      // Map official step types to your renderer's expected format
      const convertedStep = this.convertSingleStep(step);
      if (convertedStep) {
        rendererSteps.push(convertedStep);
      }
    }
    
    return rendererSteps;
  }

  /**
   * Convert a single step from official format to renderer format
   */
  convertSingleStep(step) {
    // Map of official step types to renderer actions
    const stepTypeMap = {
      // Official → Renderer
      'arrive': { action: 'arrive', fighter: step.fighter },
      'move': { action: 'move', fighter: step.fighter, target: step.target },
      'moveBack': { action: 'moveBack', fighter: step.fighter },
      'hit': { 
        action: 'hit', 
        fighter: step.fighter, 
        target: step.target,
        damage: step.damage,
        critical: step.critical,
        weapon: step.weapon,
      },
      'miss': { action: 'miss', fighter: step.fighter, target: step.target },
      'evade': { action: 'evade', fighter: step.fighter },
      'block': { action: 'block', fighter: step.fighter, damage: step.damage },
      'counter': { 
        action: 'counter', 
        fighter: step.fighter,
        target: step.target,
        damage: step.damage,
      },
      'throw': {
        action: 'throw',
        fighter: step.fighter,
        target: step.target,
        weapon: step.weapon,
        damage: step.damage,
      },
      'disarm': { action: 'disarm', fighter: step.fighter, target: step.target },
      'steal': { action: 'steal', fighter: step.fighter, target: step.target, weapon: step.weapon },
      'equip': { action: 'equip', fighter: step.fighter, weapon: step.weapon },
      'trap': { action: 'trap', fighter: step.fighter, target: step.target },
      'bomb': { action: 'bomb', fighter: step.fighter, damage: step.damage },
      'flashFlood': { action: 'flashFlood', damage: step.damage },
      'sabotage': { action: 'sabotage', fighter: step.fighter },
      'hypnotize': { action: 'hypnotize', fighter: step.fighter, target: step.target },
      'poison': { action: 'poison', target: step.target, damage: step.damage },
      'heal': { action: 'heal', fighter: step.fighter, amount: step.amount },
      'petAttack': {
        action: 'petAttack',
        pet: step.pet,
        target: step.target,
        damage: step.damage,
      },
      'death': { action: 'death', fighter: step.fighter },
      'end': { action: 'end', winner: step.winner, loser: step.loser },
    };

    // Get the mapped step or return raw if not mapped
    const mappedStep = stepTypeMap[step.type] || step;
    
    // Add any additional data that might be needed
    return {
      ...mappedStep,
      // Preserve original type for debugging
      originalType: step.type,
      // Add fighter positions if available
      fighterHP: step.fighterHP,
      targetHP: step.targetHP,
    };
  }

  /**
   * Get the next step for animation
   */
  getNextStep() {
    if (this.currentStepIndex < this.steps.length) {
      return this.steps[this.currentStepIndex++];
    }
    return null;
  }

  /**
   * Reset the fight to start
   */
  reset() {
    this.currentStepIndex = 0;
  }

  /**
   * Process all steps at once (for testing)
   */
  async processAllSteps(onStepCallback) {
    for (const step of this.steps) {
      if (onStepCallback) {
        await onStepCallback(step);
      }
      // Add delay between steps for animation
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
}

// Export for use in FightSceneSpine
export default LaBruteOfficialAdapter;