import * as pets from '../game/pets.js';
import * as customPets from '../game/pets_custom.js';
const CUSTOM_MODE = (typeof process !== 'undefined' && process.env.CUSTOM_MODE) || (import.meta.env && import.meta.env.VITE_CUSTOM_MODE);
const { createPet } = CUSTOM_MODE ? customPets : pets;
import { RNG } from './rng.js';
import formulas from './formulas.js';

// Import du système LaBrute complet
import { 
  LaBruteCombatEngine, 
  LaBruteCombatFormulas,
  LABRUTE_WEAPONS,
  LABRUTE_SKILLS,
  LABRUTE_PETS,
  LABRUTE_CONFIG
} from './labrute-complete.js';

export class CombatEngine {
  constructor(fighter1, fighter2, options = {}) {
    // Utiliser le moteur LaBrute si spécifié
    if (options.useLaBrute !== false) {
      console.log('[CombatEngine] Utilisation du système LaBrute complet');
      // LaBruteCombatEngine attend un RNG, pas un objet options
      const rng = options.rng || new RNG();
      const labEngine = new LaBruteCombatEngine(fighter1, fighter2, rng.random ? rng.random.bind(rng) : rng);
      // Copier la propriété turnInProgress pour la compatibilité
      labEngine.turnInProgress = false;
      return labEngine;
    }
    this.fighter1 = fighter1;
    this.fighter2 = fighter2;
    this.currentTurn = 0;
    this.activePlayer = null; // Sera déterminé par l'initiative
    this.turnInProgress = false; // Add turn lock
    this.lastWeaponThrowTurn = -1; // Track when last weapon was thrown
    this.comboCounter = { [fighter1.stats.name]: 0, [fighter2.stats.name]: 0 }; // Track combo hits
    this.lastAttacker = null; // Track who attacked last for combo tracking
    this.initiativeOrder = []; // Ordre de jeu basé sur l'initiative
    this.currentInitiativeIndex = 0; // Index dans l'ordre d'initiative
    this.roundComplete = false; // Pour savoir quand recalculer l'initiative
    this.consecutiveStats = { // Track consecutive actions for achievements
      [fighter1.stats.name]: { counters: 0, blocks: 0, evades: 0, throws: 0 },
      [fighter2.stats.name]: { counters: 0, blocks: 0, evades: 0, throws: 0 }
    };
    this.combatSteps = []; // Detailed combat steps for replay
    
    // Injectables: seedable RNG and formulas adapter (parity by default)
    const { rng, formulasAdapter } = options || {};
    this.rng = rng || new RNG();
    this.formulas = formulasAdapter || formulas;
    // Debug instrumentation
    this.debug = Boolean(options && options.debug);
    this.debugLogs = [];
    // Optionally instrument formulas to log inputs/outputs
    if (this.debug || (options && options.instrumentFormulas)) {
      const original = this.formulas;
      const fmtArg = (a) => {
        if (a && typeof a === 'object' && 'strength' in a && 'agility' in a) {
          return {
            name: a.name,
            strength: a.strength,
            defense: a.defense,
            agility: a.agility,
            speed: a.speed,
            baseInitiative: a.baseInitiative,
            combo: a.combo,
            counter: a.counter,
          };
        }
        return a;
      };
      const wrap = (key, fn) => (...args) => {
        const result = fn(...args);
        this.logDebug(`formula.${key}`, { args: args.map(fmtArg), result });
        return result;
      };
      const instrumented = {};
      for (const [k, v] of Object.entries(original)) {
        instrumented[k] = typeof v === 'function' ? wrap(k, v) : v;
      }
      this.formulas = instrumented;
    }
    
    // Initialize pets if fighters have them
    this.initializePets();

    // Flag to enable custom special moves (disabled by default)
    this.enableCustomMoves = Boolean(options.enableCustomMoves);

    if (this.enableCustomMoves) {
      // Initialize special moves for both fighters
      this.initializeSpecialMoves();
    } else {
      // Ensure structure exists but skip custom moves to match original behavior
      this.specialMoves = {};
      [this.fighter1, this.fighter2].forEach(fighter => {
        fighter.specialMoves = { unlocked: [], active: {} };
      });
      // Still calculate initiative even when special moves are disabled
      this.calculateInitiative();
    }
  }
  
  initializePets() {
    // Initialize pets for both fighters if they have them
    [this.fighter1, this.fighter2].forEach(fighter => {
      if (fighter.petType) {
        fighter.pet = createPet(fighter.petType, fighter, this.rng);
      }
    });
  }
  
  initializeSpecialMoves() {
    // Available special moves
    this.specialMoves = {
      berserkerRage: {
        name: 'Berserker Rage',
        description: 'Double damage for 3 turns',
        duration: 3,
        effect: 'damage_boost',
        multiplier: 2,
        unlockChance: 0.15
      },
      defensiveShield: {
        name: 'Defensive Shield', 
        description: 'Reduces incoming damage by 50% for 3 turns',
        duration: 3,
        effect: 'defense_boost',
        multiplier: 0.5,
        unlockChance: 0.12
      },
      vampiricStrike: {
        name: 'Vampiric Strike',
        description: 'Next attack heals for 50% of damage dealt',
        duration: 1,
        effect: 'lifesteal',
        multiplier: 0.5,
        unlockChance: 0.10
      },
      adrenalineRush: {
        name: 'Adrenaline Rush',
        description: 'Restores full stamina and increases accuracy',
        duration: 2,
        effect: 'stamina_accuracy',
        multiplier: 1.5,
        unlockChance: 0.08
      },
      lightningReflexes: {
        name: 'Lightning Reflexes',
        description: 'Grants a chance for an extra attack each turn',
        duration: 5,
        effect: 'multi_attack',
        multiplier: 0.3, // 30% chance for an extra hit
        unlockChance: 0.05
      }
    };
    
    // Initialize fighter special move states
    [this.fighter1, this.fighter2].forEach(fighter => {
      fighter.specialMoves = {
        unlocked: [],
        active: {}
      };
    });
    
    // Calculer l'initiative initiale
    this.calculateInitiative();
  }
  
  // Add a combat step for replay
  addCombatStep(type, data) {
    this.combatSteps.push({
      turn: this.currentTurn,
      type: type,
      timestamp: Date.now(),
      ...data
    });
  }

  // Debug logging (instrumentation)
  logDebug(event, data = {}) {
    if (!this.debug) return;
    try {
      this.debugLogs.push({ turn: this.currentTurn, event, ...data });
    } catch (_) {
      // no-op
    }
  }
  
  // Track consecutive actions for achievements
  updateConsecutiveStats(fighter, action, reset = false) {
    const stats = this.consecutiveStats[fighter.stats.name];
    if (!stats) return;
    
    if (reset) {
      // Reset all consecutive counters for this fighter
      stats.counters = 0;
      stats.blocks = 0;
      stats.evades = 0;
      stats.throws = 0;
      return;
    }
    
    // Reset other stats when a specific action occurs
    switch (action) {
      case 'counter':
        stats.counters++;
        stats.blocks = 0;
        stats.evades = 0;
        console.log(`${fighter.stats.name} consecutive counters: ${stats.counters}`);
        break;
      case 'block':
        stats.blocks++;
        stats.counters = 0;
        stats.evades = 0;
        console.log(`${fighter.stats.name} consecutive blocks: ${stats.blocks}`);
        break;
      case 'evade':
        stats.evades++;
        stats.counters = 0;
        stats.blocks = 0;
        console.log(`${fighter.stats.name} consecutive evades: ${stats.evades}`);
        break;
      case 'throw':
        stats.throws++;
        console.log(`${fighter.stats.name} consecutive throws: ${stats.throws}`);
        break;
      case 'hit':
        // Getting hit resets defensive stats
        stats.counters = 0;
        stats.blocks = 0;
        stats.evades = 0;
        break;
    }
    
    // Check for achievement thresholds
    if (stats.counters >= 4) {
      console.log(`🏆 ${fighter.stats.name} achieves 4 consecutive counters!`);
      this.addCombatStep('achievement', { fighter: fighter.stats.name, achievement: 'counter4b2b' });
    }
    if (stats.blocks >= 4) {
      console.log(`🏆 ${fighter.stats.name} achieves 4 consecutive blocks!`);
      this.addCombatStep('achievement', { fighter: fighter.stats.name, achievement: 'block4b2b' });
    }
    if (stats.evades >= 4) {
      console.log(`🏆 ${fighter.stats.name} achieves 4 consecutive evades!`);
      this.addCombatStep('achievement', { fighter: fighter.stats.name, achievement: 'evade4b2b' });
    }
    if (stats.throws >= 10) {
      console.log(`🏆 ${fighter.stats.name} achieves 10 consecutive throws!`);
      this.addCombatStep('achievement', { fighter: fighter.stats.name, achievement: 'throw10b2b' });
    }
  }
  
  calculateInitiative() {
    // Calculer l'initiative pour chaque fighter
    // Initiative = baseInitiative + (speed * 0.01) + random(0, 0.1)
    // Plus l'initiative est BASSE, plus on joue TÔT (comme LaBrute officiel)
    
    this.fighter1.stats.initiative = this.formulas.computeInitiative(this.fighter1.stats, this.rng);
    
    this.fighter2.stats.initiative = this.formulas.computeInitiative(this.fighter2.stats, this.rng);
    
    // Déterminer l'ordre de jeu (le plus petit joue en premier)
    if (this.fighter1.stats.initiative <= this.fighter2.stats.initiative) {
      this.initiativeOrder = [this.fighter1, this.fighter2];
    } else {
      this.initiativeOrder = [this.fighter2, this.fighter1];
    }
    
    // Définir le premier joueur actif
    this.currentInitiativeIndex = 0;
    this.activePlayer = this.initiativeOrder[0];
    this.roundComplete = false;
    this.logDebug('initiative', {
      f1: { name: this.fighter1.stats.name, base: this.fighter1.stats.baseInitiative, speed: this.fighter1.stats.speed, value: this.fighter1.stats.initiative },
      f2: { name: this.fighter2.stats.name, base: this.fighter2.stats.baseInitiative, speed: this.fighter2.stats.speed, value: this.fighter2.stats.initiative },
      order: this.initiativeOrder.map(f => f.stats.name)
    });
  }
  
  executeTurn() {
    // Prevent multiple simultaneous turn executions
    if (this.turnInProgress) {
      // Guard: avoid re-entrancy
      this.logDebug('turn_busy', { currentTurn: this.currentTurn, active: this.activePlayer ? this.activePlayer.stats.name : null });
      return null;
    }
    
    // Safety check for valid fighters
    if (!this.activePlayer || this.activePlayer.stats.health <= 0) {
      this.logDebug('invalid_active', {
        currentTurn: this.currentTurn,
        active: this.activePlayer && this.activePlayer.stats ? { name: this.activePlayer.stats.name, hp: this.activePlayer.stats.health } : null,
        f1: { name: this.fighter1.stats.name, hp: this.fighter1.stats.health },
        f2: { name: this.fighter2.stats.name, hp: this.fighter2.stats.health },
      });
      // Minimal recovery: recompute initiative to restore a valid active player next call
      try { this.calculateInitiative(); } catch (_) { /* no-op */ }
      // Reset lock and return null for this tick
      this.turnInProgress = false;
      return null;
    }
    
    try {
      this.turnInProgress = true;
      this.currentTurn++;
      
      const attacker = this.activePlayer;
      const defender = attacker === this.fighter1 ? this.fighter2 : this.fighter1;
      
      // Ensure defender is valid - remove the health check here
      // Death should only happen from actual damage, not from pre-turn checks
      if (!defender) {
        this.turnInProgress = false;
        return {
          type: 'error',
          attacker: attacker,
          target: defender,
          message: `No valid defender!`,
          gameOver: false,
          winner: null
        };
      }
      
      // SPECIAL MOVES DISABLED - Too slow for combat rhythm
      // this.processSpecialMoveEffects(attacker);
      // this.processSpecialMoveEffects(defender);
      
      // Special move unlocking DISABLED
      const unlockedMove = null; // this.tryUnlockSpecialMove(attacker);
      
      // Check for skill abilities first
      const skillResult = this.checkSkillAbilities(attacker, defender);
      if (skillResult === 'treated') {
        // Skill was used, continue with normal turn
      } else if (skillResult === 'extra_turn') {
        // Don't switch turns for haste effect
        this.turnInProgress = false;
        return { type: 'skill', skill: 'haste', message: `${attacker.stats.name} gains an extra action!` };
      }
      
      // Check stamina for action
      if (attacker.stats.stamina < 20) {
        attacker.stats.stamina = Math.min(attacker.stats.maxStamina, attacker.stats.stamina + 30);
        this.switchTurns();
        
        let message = `${attacker.stats.name} recovers stamina!`;
        if (unlockedMove) {
          message += ` ${attacker.stats.name} unlocks ${unlockedMove.name}!`;
        }
        
        // Mark turn as complete before returning
        this.turnInProgress = false;
        
        return {
          type: 'rest',
          attacker: attacker,
          target: defender,
          message: message,
          unlockedMove: unlockedMove,
          gameOver: false
        };
      }
      
      // Decide between normal attack, special move, or weapon throw
      const useSpecialMove = attacker.specialMoves.unlocked.length > 0 && this.rng.chance(0.3);
      
      // Calculate weapon throw chance using official LaBrute formula
      let throwChance = 0;
      if (attacker.hasWeapon) {
        const weaponData = this.getWeaponData(attacker.weaponType);
        if (weaponData) {
          // Check if it's a thrown-type weapon (shuriken, piopio, noodleBowl)
          const thrownWeapons = ['shuriken', 'piopio', 'noodleBowl'];
          if (thrownWeapons.includes(attacker.weaponType)) {
            throwChance = 0.7; // 70% for thrown-type weapons (augmenté pour test)
          } else {
            // Formula: 1/(33 - tempo*5) for normal weapons
            const tempo = weaponData.tempo || 1.2;
            throwChance = 1 / Math.max(10, 33 - tempo * 5);
            // TEMPORAIRE: Augmenter beaucoup pour tester
            throwChance = Math.max(throwChance, 0.3); // Minimum 30% pour tester
          }
          console.log(`Weapon throw chance for ${attacker.weaponType}: ${throwChance}`);
        }
      }
      
      // NO_WEAPON_TOSS: 10% chance to attack bare hands even with weapon
      const NO_WEAPON_TOSS = 0.10;
      const useBareHands = attacker.hasWeapon && this.rng.chance(NO_WEAPON_TOSS);
      
      // Prevent throwing if a weapon was thrown in the last 2 turns to avoid simultaneous throws
      const canThrowWeapon = attacker.hasWeapon && !useBareHands && (this.currentTurn - this.lastWeaponThrowTurn) >= 2;
      const throwWeapon = canThrowWeapon && this.rng.chance(throwChance);
      
      // Debug logs
      console.log(`Throw check - Can throw: ${canThrowWeapon}, Will throw: ${throwWeapon}, Stamina: ${attacker.stats.stamina}, Turn: ${this.currentTurn}, Last throw: ${this.lastWeaponThrowTurn}`);
      
      let result;
      if (throwWeapon && attacker.stats.stamina >= 20) { // Réduit de 35 à 20 pour tester
        console.log(`${attacker.stats.name} is throwing weapon!`);
        result = this.executeWeaponThrow(attacker, defender);
      } else if (useSpecialMove && attacker.stats.stamina >= 40) {
        result = this.executeSpecialMove(attacker, defender);
      } else {
        // Si on décide d'utiliser les mains nues, on désactive temporairement l'arme
        const originalWeapon = attacker.weaponType;
        const originalHasWeapon = attacker.hasWeapon;
        
        if (useBareHands) {
          attacker.weaponType = null;
          attacker.hasWeapon = false;
        }
        
        result = this.calculateAttack(attacker, defender);
        
        // Restaurer l'arme après l'attaque à mains nues
        if (useBareHands) {
          attacker.weaponType = originalWeapon;
          attacker.hasWeapon = originalHasWeapon;
          result.bareHands = true; // Marquer que c'était une attaque à mains nues
        }
      }
      
      if (unlockedMove) {
        result.message += ` ${attacker.stats.name} unlocks ${unlockedMove.name}!`;
        result.unlockedMove = unlockedMove;
      }
      
      // Don't execute additional attacks if the primary was countered
      if (!result.countered) {
        // Check for multi-attack after the primary action
        result.multiAttack = this.executeMultiAttack(attacker, defender);
        
        // Check for pet assistance after the primary action
        result.petAssist = this.executePetAssistance(attacker, defender, result);
      }
      
      this.switchTurns();
      
      // Check for game over
      const gameOver = defender.stats.health <= 0;
      const winner = gameOver ? attacker : null;
      
      result.gameOver = gameOver;
      result.winner = winner;
      
      // Mark turn as complete
      this.turnInProgress = false;
      
      return result;
      
    } catch (error) {
      console.error("Combat error:", error.message);
      // ALWAYS reset the turn flag on error to prevent deadlock
      this.turnInProgress = false;
      
      // Try to recover by switching turns
      this.switchTurns();
      
      return {
        type: 'error',
        attacker: this.activePlayer,
        target: this.activePlayer === this.fighter1 ? this.fighter2 : this.fighter1,
        message: 'Turn error - skipping',
        gameOver: false
      };
    }
  }
  
  executeMultiAttack(attacker, defender) {
    // Base chance from agility (e.g., 0.5% per point of agility)
    let multiAttackChance = attacker.stats.agility * 0.005;
    
    // Lightning reflexes DISABLED for faster combat
    const reflexActive = false; // attacker.specialMoves.active.lightningReflexes;
    
    // Reflexes bonus DISABLED
    // if (reflexActive) {
    //   multiAttackChance += this.specialMoves.lightningReflexes.multiplier;
    // }
    // Ensure we have a chance and enough stamina
    if (multiAttackChance > 0 && this.rng.chance(multiAttackChance) && attacker.stats.stamina >= 15) {
      // Stamina cost for extra attack
      attacker.stats.stamina -= 15;
      
      // Perform a weaker, faster follow-up attack
      const followUpAttack = this.calculateAttack(attacker, defender, 0.6); // 60% damage
      
      // Customize message based on what triggered the attack
      let message;
      if (reflexActive) {
        message = `👟 ${attacker.stats.name}'s reflexes grant another strike for ${followUpAttack.damage} damage!`;
      } else {
        message = `💨 ${attacker.stats.name} is quick enough for a follow-up attack, dealing ${followUpAttack.damage} damage!`;
      }
      
      followUpAttack.message = message;
      followUpAttack.type = 'multi_attack'; // Differentiate for animation
      return followUpAttack;
    }
    
    return null;
  }
  
  executePetAssistance(attacker, defender, primaryResult) {
    const pet = attacker.pet;
    
    // Only assist if pet exists, is alive, and primary action hit or was successful
    if (!pet || !pet.isAlive || (!primaryResult.hit && primaryResult.type !== 'special')) {
      return null;
    }
    
    // Check if pet should assist
    if (!pet.canAssist()) {
      return null;
    }
    
    // Create assistance result based on pet type and ability
    const assistResult = this.calculatePetAction(pet, defender);
    
    // Apply pet assistance effects
    if (assistResult.damage > 0) {
      defender.stats.health = Math.max(0, defender.stats.health - assistResult.damage);
      
      // Apply status effects if any
      if (assistResult.statusEffect) {
        this.applyStatusEffect(defender, assistResult.statusEffect);
      }
    }
    
    return assistResult;
  }
  
  calculatePetAction(pet, target) {
    const owner = pet.owner;
    const effect = pet.getAbilityEffect(target);
    
    // Apply defense reduction
    const reducedDefense = Math.floor(target.stats.defense * 0.4); // Pets bypass some defense
    const finalDamage = Math.max(0, effect.damage - reducedDefense);
    
    return {
      type: 'pet_assist',
      pet: pet,
      owner: owner,
      target: target,
      damage: finalDamage,
      ability: pet.ability,
      specialEffect: effect.specialEffect,
      statusEffect: effect.statusEffect,
      message: `${owner.stats.name}'s ${effect.message}`
    };
  }
  
  applyStatusEffect(target, effect) {
    if (!target.statusEffects) {
      target.statusEffects = [];
    }
    
    // Check if effect already exists
    const existing = target.statusEffects.find(e => e.type === effect.type);
    if (existing) {
      existing.duration = Math.max(existing.duration, effect.duration);
    } else {
      target.statusEffects.push({ ...effect, remainingDuration: effect.duration });
    }
  }
  
  calculateAttack(attacker, defender, damageModifier = 1.0) {
    // Stamina cost
    attacker.stats.stamina -= 20;
    
    // Check for counter-attack chance BEFORE the attack
    const counterChance = this.formulas.computeCounterChance(defender.stats);
    const willCounter = defender.stats.stamina >= 25 && this.rng.chance(counterChance);
    this.logDebug('counter_check', { attacker: attacker.stats.name, defender: defender.stats.name, counterChance, willCounter, defenderStamina: defender.stats.stamina });
    
    if (willCounter) {
      defender.stats.stamina -= 25;
      
      // Calculate counter damage
      const counterDamage = this.formulas.computeCounterDamage(defender.stats, this.rng);
      attacker.stats.health = Math.max(0, attacker.stats.health - counterDamage);
      
      // Track consecutive counter
      this.updateConsecutiveStats(defender, 'counter');
      this.updateConsecutiveStats(attacker, 'hit'); // Reset attacker's defensive stats
      
      return {
        type: 'counter',
        attacker: attacker,
        target: defender,
        hit: true,
        damage: counterDamage,
        message: `⚔️ ${defender.stats.name} counters the attack for ${counterDamage} damage!`,
        countered: true
      };
    }
    
    // Block check based on defender's defense stat
    const blockChance = this.formulas.computeBlockChance(defender.stats);
    const hasStaminaForBlock = defender.stats.stamina >= 15;
    const blockSuccess = hasStaminaForBlock && this.rng.float() < blockChance;
    this.logDebug('block_check', { attacker: attacker.stats.name, defender: defender.stats.name, blockChance, hasStaminaForBlock, blockSuccess });
    
    // Show debug indicator for block calculation (guarded)
    if (defender.scene && typeof defender.scene.showBlockChanceIndicator === 'function') {
      defender.scene.showBlockChanceIndicator(defender, blockChance, hasStaminaForBlock, blockSuccess, hasStaminaForBlock);
    }
    
    if (blockSuccess) {
      defender.stats.stamina -= 15; // Stamina cost for blocking
      const damageReduction = 0.75; // 75% damage reduction
      
      // Compute blocked damage via formulas adapter
      const finalBlockedDamage = this.formulas.computeBlockDamage(attacker.stats, this.rng, damageReduction);
      defender.stats.health = Math.max(0, defender.stats.health - finalBlockedDamage);
      
      // Track consecutive block
      this.updateConsecutiveStats(defender, 'block');
      
      return {
        type: 'block',
        attacker: attacker,
        target: defender,
        hit: true,
        damage: finalBlockedDamage,
        message: `🛡️ ${defender.stats.name} blocks the attack, taking only ${finalBlockedDamage} damage!`
      };
    }
    
    // Dodge check based on defender's agility
    // AGI provides a 0.8% chance to dodge per point.
    const dodgeChance = this.formulas.computeDodgeChance(defender.stats);
    const dodgeSuccess = this.rng.float() < dodgeChance;
    this.logDebug('dodge_check', { attacker: attacker.stats.name, defender: defender.stats.name, dodgeChance, dodgeSuccess });
    
    // Show debug indicator for dodge calculation (guarded)
    if (defender.scene && typeof defender.scene.showDodgeChanceIndicator === 'function') {
      defender.scene.showDodgeChanceIndicator(defender, dodgeChance, true, dodgeSuccess);
    }
    
    if (dodgeSuccess) {
      // Track consecutive dodge
      this.updateConsecutiveStats(defender, 'evade');
      
      return {
        type: 'dodge',
        attacker: attacker,
        target: defender,
        hit: false,
        damage: 0,
        message: `💨 ${defender.stats.name} dodges!`,
        dodgedAction: 'attack'
      };
    }
    
    // Base accuracy + weapon modifiers via formulas adapter
    let accuracy = this.formulas.computeAccuracy(attacker.stats, attacker.weaponType);
    
    // RNG hit check
    const hit = this.rng.float() < accuracy;
    this.logDebug('hit_check', { attacker: attacker.stats.name, defender: defender.stats.name, accuracy, hit, weaponType: attacker.weaponType });
    
    if (!hit) {
      return {
        type: 'attack',
        attacker: attacker,
        target: defender,
        hit: false,
        damage: 0,
        message: `${attacker.stats.name} misses!`
      };
    }
    
    // Calculate base damage via formulas adapter
    let baseDamage = this.formulas.computeBaseDamage(attacker.stats, attacker.hasWeapon, attacker.weaponType);
    
    // Berserker rage DISABLED for faster combat
    // if (attacker.specialMoves.active.berserkerRage) {
    //   baseDamage *= this.specialMoves.berserkerRage.multiplier;
    // }
    
    // RNG damage variation (±25%)
    const damageVariation = this.formulas.computeDamageVariation(this.rng);
    let finalDamage = Math.floor(baseDamage * damageVariation * damageModifier);
    
    // Apply defense
    let effectiveDefense = defender.stats.defense;
    
    // Defensive shield DISABLED for faster combat
    // if (defender.specialMoves.active.defensiveShield) {
    //   finalDamage *= this.specialMoves.defensiveShield.multiplier;
    // }
    
    // La défense réduit les dégâts mais ne peut pas les annuler complètement
    // Minimum 1 dégât si l'attaque touche
    finalDamage = Math.max(1, finalDamage - Math.floor(effectiveDefense * 0.5));
    
    // Weapon-specific critical hit chances via formulas adapter
    const criticalChance = this.formulas.computeCritChance(attacker.weaponType);
    const critical = this.rng.float() < criticalChance;
    if (critical) {
      finalDamage *= 2;
    }
    this.logDebug('damage_calc', {
      attacker: attacker.stats.name,
      defender: defender.stats.name,
      baseDamage,
      damageVariation,
      effectiveDefense,
      criticalChance,
      critical,
      finalDamage,
      damageModifier
    });
    
    // Vampiric healing DISABLED for faster combat
    // if (attacker.specialMoves.active.vampiricStrike) {
    //   const healing = Math.floor(finalDamage * this.specialMoves.vampiricStrike.multiplier);
    //   attacker.stats.health = Math.min(attacker.stats.health + healing, attacker.stats.maxHealth);
    // }
    
    // Apply damage (special handling for backups)
    if (defender.isBackup) {
      this.handleBackupDamage(defender, finalDamage);
    } else {
      defender.stats.health = Math.max(0, defender.stats.health - finalDamage);
    }
    
    // Vampirism skill effect
    if (attacker.stats.skills && attacker.stats.skills.includes('vampirism')) {
      const vampHeal = Math.floor(finalDamage * 0.3); // 30% lifesteal
      attacker.stats.health = Math.min(attacker.stats.health + vampHeal, attacker.stats.maxHealth);
      console.log(`${attacker.stats.name} drains ${vampHeal} HP! (Vampirism)`);
      this.addCombatStep('skill_activate', {
        fighter: attacker.stats.name,
        skill: 'vampirism',
        healAmount: vampHeal,
        newHealth: attacker.stats.health
      });
    }
    
    // Check for combo
    let comboHits = 0;
    let comboMessage = '';
    if (this.lastAttacker === attacker && hit) {
      // Base combo chance from stats
      const comboChance = this.formulas.computeComboChance(attacker.stats);
      
      if (this.rng.chance(comboChance)) {
        // Determine combo length (3-5 hits)
        const maxCombo = this.formulas.computeMaxCombo(attacker.stats);
        comboHits = this.rng.int(3, maxCombo); // 3 to maxCombo hits
        
        // Execute combo hits
        let totalComboDamage = 0;
        for (let i = 0; i < comboHits - 1; i++) { // -1 because first hit already done
          const comboMultiplier = 0.6 + (i * 0.1); // Each hit gets stronger
          const comboDamage = Math.floor(finalDamage * comboMultiplier);
          totalComboDamage += comboDamage;
          defender.stats.health = Math.max(0, defender.stats.health - comboDamage);
        }
        
        comboMessage = ` COMBO x${comboHits}! (+${totalComboDamage} damage)`;
        this.comboCounter[attacker.stats.name] = comboHits;
        this.logDebug('combo', { attacker: attacker.stats.name, comboChance, comboHits, maxCombo, totalDamage: totalComboDamage });
      }
    }
    
    // Track last attacker for combo chains
    this.lastAttacker = attacker;
    
    // Reset defender's consecutive defensive stats when hit
    this.updateConsecutiveStats(defender, 'hit');
    
    const critText = critical ? ' CRITICAL HIT!' : '';
    const rageText = attacker.specialMoves.active.berserkerRage ? ' [RAGE]' : '';
    const shieldText = defender.specialMoves.active.defensiveShield ? ' [SHIELDED]' : '';
    const lifeStealText = attacker.specialMoves.active.vampiricStrike ? ` +${Math.floor(finalDamage * this.specialMoves.vampiricStrike.multiplier)} HP` : '';
    const comboText = comboMessage;
    
    const result = {
      type: 'attack',
      attacker: attacker,
      target: defender,
      hit: true,
      damage: finalDamage,
      critical: critical,
      message: `${attacker.stats.name} hits for ${finalDamage} damage${critText}${rageText}${shieldText}${lifeStealText}${comboText}`,
      combo: comboHits > 0 ? comboHits : undefined
    };
    
    // SAFETY CHECK: Validate hit detection consistency
    return this.validateCombatResult(result);
  }
  
  // Check for skill-based abilities
  checkSkillAbilities(fighter, opponent) {
    const skills = fighter.stats.skills || [];
    
    // Haste - chance for extra attack
    if (skills.includes('haste') && this.rng.chance(0.15)) {
      console.log(`${fighter.stats.name} moves with incredible speed! (Haste)`);
      this.addCombatStep('skill_activate', { 
        fighter: fighter.stats.name, 
        skill: 'haste',
        effect: 'extra_turn'
      });
      return 'extra_turn';
    }
    
    // Treat - healing ability
    if (skills.includes('treat') && fighter.stats.health < fighter.stats.maxHealth * 0.5 && this.rng.chance(0.2)) {
      const healAmount = Math.floor(fighter.stats.maxHealth * 0.15);
      fighter.stats.health = Math.min(fighter.stats.health + healAmount, fighter.stats.maxHealth);
      console.log(`${fighter.stats.name} heals for ${healAmount} HP! (Treat)`);
      this.addCombatStep('skill_activate', { 
        fighter: fighter.stats.name, 
        skill: 'treat',
        healAmount: healAmount,
        newHealth: fighter.stats.health
      });
      return 'treated';
    }
    
    // Fast Metabolism - passive regen
    if (skills.includes('fastMetabolism') && this.rng.chance(0.3)) {
      const regenAmount = Math.floor(fighter.stats.maxHealth * 0.05);
      fighter.stats.health = Math.min(fighter.stats.health + regenAmount, fighter.stats.maxHealth);
      console.log(`${fighter.stats.name} regenerates ${regenAmount} HP! (Fast Metabolism)`);
      this.addCombatStep('skill_activate', { 
        fighter: fighter.stats.name, 
        skill: 'fastMetabolism',
        healAmount: regenAmount,
        newHealth: fighter.stats.health
      });
    }
    
    // Hideaway - temporary evasion boost
    if (skills.includes('hideaway') && fighter.stats.health < fighter.stats.maxHealth * 0.3 && this.rng.chance(0.25)) {
      fighter.temporaryEvasion = (fighter.temporaryEvasion || 0) + 0.5;
      console.log(`${fighter.stats.name} hides in the shadows! (Hideaway)`);
      this.addCombatStep('skill_activate', { 
        fighter: fighter.stats.name, 
        skill: 'hideaway',
        effect: 'evasion_boost'
      });
      setTimeout(() => {
        fighter.temporaryEvasion = 0;
      }, 3000);
    }
    
    return null;
  }

  executeSpecialMove(attacker, defender) {
    // Higher stamina cost for special moves
    attacker.stats.stamina -= 40;
    
    // Select random unlocked special move
    const randomMove = attacker.specialMoves.unlocked[this.rng.int(0, attacker.specialMoves.unlocked.length - 1)];
    const moveData = this.specialMoves[randomMove];
    
    // Activate the special move
    attacker.specialMoves.active[randomMove] = moveData.duration;
    
    // Special move specific effects
    if (randomMove === 'adrenalineRush') {
      attacker.stats.stamina = attacker.stats.maxStamina;
    }
    
    return {
      type: 'special',
      attacker: attacker,
      target: defender,
      specialMove: moveData,
      message: `${attacker.stats.name} activates ${moveData.name}! ${moveData.description}`
    };
  }
  
  tryUnlockSpecialMove(fighter) {
    // Skip if fighter has all special moves
    const availableMoves = Object.keys(this.specialMoves).filter(move => 
      !fighter.specialMoves.unlocked.includes(move)
    );
    
    if (availableMoves.length === 0) return null;
    
    // Check each available move for unlock
    for (const moveKey of availableMoves) {
      const move = this.specialMoves[moveKey];
      if (this.rng.chance(move.unlockChance)) {
        fighter.specialMoves.unlocked.push(moveKey);
        return move;
      }
    }
    
    return null;
  }
  
  processSpecialMoveEffects(fighter) {
    // Decrease duration of active special moves
    Object.keys(fighter.specialMoves.active).forEach(moveKey => {
      fighter.specialMoves.active[moveKey]--;
      
      if (fighter.specialMoves.active[moveKey] <= 0) {
        delete fighter.specialMoves.active[moveKey];
      }
    });
  }
  executeWeaponThrow(attacker, defender) {
    // Record this turn as having a weapon throw
    this.lastWeaponThrowTurn = this.currentTurn;
    
    // Stamina cost for weapon throw (reduced for testing)
    attacker.stats.stamina -= 20;
    
    // Base accuracy for thrown weapons (higher than normal due to surprise)
    let accuracy = 0.85;
    
    // Adrenaline rush DISABLED for faster combat
    // if (attacker.specialMoves.active.adrenalineRush) {
    //   accuracy *= this.specialMoves.adrenalineRush.multiplier;
    // }
    
    // Defender can try to dodge the throw
    const dodgeChance = defender.stats.agility * 0.006; // Lower dodge chance vs throws
    const dodgeSuccess = this.rng.float() < dodgeChance;
    this.logDebug('throw_dodge_check', { attacker: attacker.stats.name, defender: defender.stats.name, dodgeChance, dodgeSuccess });
    
    // Show debug indicator for weapon throw dodge calculation (guarded)
    if (defender.scene && typeof defender.scene.showDodgeChanceIndicator === 'function') {
      defender.scene.showDodgeChanceIndicator(defender, dodgeChance, true, dodgeSuccess);
    }
    
    if (dodgeSuccess) {
      // Check if weapon is kept (thrown-type weapons)
      const thrownWeapons = ['shuriken', 'piopio', 'noodleBowl'];
      if (!thrownWeapons.includes(attacker.weaponType)) {
        attacker.hasWeapon = false; // Normal weapon is lost
      }
      
      // Track consecutive dodge
      this.updateConsecutiveStats(defender, 'evade');
      
      return {
        type: 'dodge',
        attacker: attacker,
        target: defender,
        hit: false,
        damage: 0,
        weaponLost: true,
        message: ` ${defender.stats.name} dodges the ${attacker.weaponType}!`,
        dodgedAction: 'throw'
      };
    }
    
    // Weapon type affects throw accuracy
    switch (attacker.weaponType) {
      case 'dagger':
        accuracy += 0.10; // Daggers are easier to throw accurately
        break;
      case 'spear':
        accuracy += 0.05; // Spears are designed for throwing
        break;
      case 'hammer':
        accuracy -= 0.20; // Hammers are hard to throw accurately
        break;
      case 'axe':
        accuracy -= 0.10; // Axes are somewhat unwieldy when thrown
        break;
    }
    
    // RNG hit check
    const hit = this.rng.chance(accuracy);
    this.logDebug('throw_hit_check', { attacker: attacker.stats.name, defender: defender.stats.name, accuracy, hit, weaponType: attacker.weaponType });
    
    if (!hit) {
      // Weapon is still thrown and lost even on miss
      // Check if weapon is kept (thrown-type weapons)
      const thrownWeapons2 = ['shuriken', 'piopio', 'noodleBowl'];
      if (!thrownWeapons2.includes(attacker.weaponType)) {
        attacker.hasWeapon = false; // Normal weapon is lost
      }
      
      return {
        type: 'throw',
        attacker: attacker,
        target: defender,
        hit: false,
        damage: 0,
        weaponLost: true,
        message: `${attacker.stats.name} throws and misses! ${attacker.weaponType} lost!`
      };
    }
    
    // Calculate throw damage (higher than normal attack due to momentum)
    let baseDamage = attacker.stats.strength * 1.4; // Throwing bonus
    
    // Weapon-specific throw damage modifiers
    switch (attacker.weaponType) {
      case 'hammer':
        baseDamage *= 1.5; // Heavy weapons hit very hard when thrown
        break;
      case 'axe':
        baseDamage *= 1.4; // Axes are devastating when thrown
        break;
      case 'spear':
        baseDamage *= 1.3; // Spears are designed for throwing
        break;
      case 'sword':
        baseDamage *= 1.2; // Swords aren't ideal for throwing
        break;
      case 'dagger':
        baseDamage *= 1.1; // Daggers are light but precise
        break;
    }
    
    // Berserker rage DISABLED for faster combat
    // if (attacker.specialMoves.active.berserkerRage) {
    //   baseDamage *= this.specialMoves.berserkerRage.multiplier;
    // }
    
    // RNG damage variation
    const damageVariation = 0.8 + (this.rng.float() * 0.4); // Less variation for throws
    let finalDamage = Math.floor(baseDamage * damageVariation);
    
    // Apply defense (reduced effectiveness against thrown weapons)
    let effectiveDefense = Math.floor(defender.stats.defense * 0.7);
    
    // Defensive shield DISABLED for faster combat
    // if (defender.specialMoves.active.defensiveShield) {
    //   finalDamage *= this.specialMoves.defensiveShield.multiplier;
    // }
    
    finalDamage = Math.max(2, finalDamage - effectiveDefense); // Minimum 2 damage for throws
    
    // Higher critical hit chance for throws (15%)
    const critical = this.rng.chance(0.15);
    if (critical) {
      finalDamage *= 2.2; // Slightly higher crit multiplier
    }
    this.logDebug('throw_damage_calc', {
      attacker: attacker.stats.name,
      defender: defender.stats.name,
      baseDamage,
      damageVariation,
      effectiveDefense,
      critical,
      finalDamage
    });
    
    // Vampiric healing (if active)
    if (attacker.specialMoves.active.vampiricStrike) {
      const healing = Math.floor(finalDamage * this.specialMoves.vampiricStrike.multiplier);
      attacker.stats.health = Math.min(attacker.stats.maxHealth, attacker.stats.health + healing);
    }
    
    // Apply damage
    defender.stats.health = Math.max(0, defender.stats.health - finalDamage);
    
    // Check if weapon is kept after throwing (thrown-type weapons)
    const thrownWeapons = ['shuriken', 'piopio', 'noodleBowl'];
    if (!thrownWeapons.includes(attacker.weaponType)) {
      // Normal weapon is lost after throwing
      attacker.hasWeapon = false;
    }
    // Thrown-type weapons are kept
    
    // Track consecutive throws
    this.updateConsecutiveStats(attacker, 'throw');
    this.updateConsecutiveStats(defender, 'hit'); // Reset defender's defensive stats
    
    const critText = critical ? ' CRITICAL THROW!' : '';
    const rageText = attacker.specialMoves.active.berserkerRage ? ' [RAGE]' : '';
    const shieldText = defender.specialMoves.active.defensiveShield ? ' [SHIELDED]' : '';
    const lifeStealText = attacker.specialMoves.active.vampiricStrike ? ` +${Math.floor(finalDamage * this.specialMoves.vampiricStrike.multiplier)} HP` : '';
    
    const result = {
      type: 'throw',
      attacker: attacker,
      target: defender,
      hit: true,
      damage: finalDamage,
      critical: critical,
      weaponLost: true,
      message: `${attacker.stats.name} hurls their ${attacker.weaponType} for ${finalDamage} damage!${critText}${rageText}${shieldText}${lifeStealText} Weapon is lost!`
    };
    return result;
  }

  switchTurns() {
    // Passer au joueur suivant dans l'ordre d'initiative, sans toucher à currentTurn
    const prevPlayer = this.activePlayer;
    const prevName = prevPlayer && prevPlayer.stats ? prevPlayer.stats.name : null;
    const prevIndex = this.currentInitiativeIndex;

    this.currentInitiativeIndex++;

    if (this.currentInitiativeIndex >= this.initiativeOrder.length) {
      // Fin de round: on recalcule l'initiative (définit activePlayer au premier)
      this.currentInitiativeIndex = 0;
      this.roundComplete = true;
      this.calculateInitiative();
    } else {
      this.activePlayer = this.initiativeOrder[this.currentInitiativeIndex];
    }

    // Filet de sécurité: s'assurer que le joueur actif est valide et vivant
    if (!this.activePlayer || !this.activePlayer.stats || this.activePlayer.stats.health <= 0) {
      if (this.fighter1.stats.health > 0 && this.fighter2.stats.health > 0) {
        this.activePlayer = prevPlayer === this.fighter1 ? this.fighter2 : this.fighter1;
      } else {
        this.activePlayer = this.fighter1.stats.health > 0 ? this.fighter1 : this.fighter2;
      }
    }

    // Reset du combo du joueur précédent si le joueur actif a changé
    if (prevPlayer && this.activePlayer && prevPlayer !== this.activePlayer) {
      const key = prevPlayer.stats && prevPlayer.stats.name;
      if (key && this.comboCounter && Object.prototype.hasOwnProperty.call(this.comboCounter, key)) {
        this.comboCounter[key] = 0;
      }
    }

    // Log de debug pour tracer les changements de tour
    this.logDebug('turn_switch', {
      prev: prevName,
      next: this.activePlayer && this.activePlayer.stats ? this.activePlayer.stats.name : null,
      prevIndex,
      nextIndex: this.currentInitiativeIndex,
      order: Array.isArray(this.initiativeOrder) ? this.initiativeOrder.map(f => f.stats.name) : [],
      roundComplete: this.roundComplete === true
    });
  }
  
  // Combat result validation system
  validateCombatResult(result) {
    // CRITICAL SAFETY CHECK: Ensure hit detection is consistent with damage dealt
    if (result.damage > 0 && !result.hit) {
      console.warn(`COMBAT VALIDATION ERROR: Damage dealt (${result.damage}) but hit=false. Correcting to hit=true`);
      result.hit = true;
      result.message += ' [HIT CORRECTED]';
    }
    
    // Ensure hit is false when no damage is dealt (for misses)
    if (result.damage === 0 && result.hit && result.type !== 'block' && result.type !== 'special') {
      console.warn(`COMBAT VALIDATION ERROR: No damage dealt (${result.damage}) but hit=true. Correcting to hit=false`);
      result.hit = false;
    }
    
    // Validate result structure integrity
    if (!result.attacker || !result.target) {
      console.error('COMBAT VALIDATION ERROR: Missing attacker or target in result');
      result.hit = false;
      result.damage = 0;
    }
    
    // Validate damage is never negative
    if (result.damage < 0) {
      console.warn(`COMBAT VALIDATION ERROR: Negative damage (${result.damage}). Setting to 0`);
      result.damage = 0;
      result.hit = false;
    }
    
    // Validate target health doesn't go negative (additional safety)
    if (result.target && result.target.stats && result.target.stats.health < 0) {
      console.warn('COMBAT VALIDATION ERROR: Target health went negative. Correcting to 0');
      result.target.stats.health = 0;
    }
    
    // Add validation timestamp for debugging
    result.validated = true;
    result.validationTime = Date.now();
    
    return result;
  }
  
  checkPreFightAchievements() {
    // Check brute achievements for both fighters
    const fighter1Achievements = this.achievementTracker.checkBruteAchievements(this.fighter1);
    const fighter2Achievements = this.achievementTracker.checkBruteAchievements(this.fighter2);
    
    // Process achievements (but don't show notifications during pre-fight)
    this.achievementTracker.processAchievements(fighter1Achievements);
    this.achievementTracker.processAchievements(fighter2Achievements);
  }
  
  trackCombatAction(result) {
    if (!result || !this.achievementTracker) return;
    
    const attacker = result.attacker;
    const defender = result.target;
    
    // Track based on action type
    switch (result.type) {
      case 'attack':
      case 'multi_attack':
        if (result.hit && result.damage > 0) {
          this.achievementTracker.trackHit(result.damage, result.combo, result.combo || 0);
        }
        break;
        
      case 'throw':
        this.achievementTracker.trackWeaponThrow();
        if (result.hit && result.damage > 0) {
          this.achievementTracker.trackHit(result.damage);
        }
        break;
        
      case 'block':
        this.achievementTracker.trackDefense('block');
        break;
        
      case 'dodge':
        this.achievementTracker.trackDefense('evade');
        break;
        
      case 'counter':
        this.achievementTracker.trackDefense('counter');
        if (result.damage > 0) {
          this.achievementTracker.trackHit(result.damage);
        }
        break;
        
      case 'steal':
        this.achievementTracker.trackWeaponSteal();
        break;
        
      case 'special':
        this.achievementTracker.trackSkillUse();
        break;
    }
    
    // Track damage taken for flawless victory
    if (defender && result.damage > 0 && result.hit) {
      // If defender is fighter1, they took damage
      if (defender === this.fighter1) {
        this.achievementTracker.trackDamageTaken();
      }
    }
    
    // Track healing
    if (result.healing > 0) {
      this.achievementTracker.trackHealing(result.healing);
    }
    
    // Track pet kills
    if (result.petKilled) {
      this.achievementTracker.trackPetKill();
    }
  }
  
  checkGameOver() {
    const fighter1Dead = this.fighter1.stats.health <= 0;
    const fighter2Dead = this.fighter2.stats.health <= 0;
    
    if (fighter1Dead || fighter2Dead) {
      const winner = fighter1Dead ? this.fighter2 : this.fighter1;
      const loser = fighter1Dead ? this.fighter1 : this.fighter2;
      
      // Check post-fight achievements
      const fightAchievements = this.achievementTracker.checkFightAchievements(
        winner === this.fighter1 ? winner : null,
        loser
      );
      
      // Process and get newly unlocked achievements
      const newAchievements = this.achievementTracker.processAchievements(fightAchievements);
      
      return {
        gameOver: true,
        winner: winner,
        loser: loser,
        achievements: newAchievements
      };
    }
    
    return null;
  }
  
  initializeBackups() {
    // Check if fighters have backup skill
    [this.fighter1, this.fighter2].forEach(fighter => {
      if (fighter.skill === 'backup') {
        // Create a potential backup brute
        const backup = this.createBackupBrute(fighter);
        if (backup) {
          this.backupBrutes[fighter.stats.name] = backup;
        }
      }
    });
  }
  
  createBackupBrute(master) {
    // In a real implementation, this would fetch from user's other brutes
    // For now, create a simulated backup brute
    const backup = {
      stats: {
        name: `${master.stats.name}'s Backup`,
        health: 60,
        maxHealth: 60,
        stamina: 80,
        maxStamina: 80,
        strength: master.stats.strength * 0.7,
        defense: master.stats.defense * 0.7,
        agility: master.stats.agility * 0.7,
        speed: master.stats.speed * 0.7,
        level: Math.max(1, (master.stats.level || 10) - 3) // Lower level than master
      },
      master: master,
      isBackup: true,
      arrivesAtTurn: this.rng.int(3, 7), // Arrives turn 3-7
      leavesAtTurn: null, // Will be set when arrives
      remainingTime: 2.8, // Stays for 2.8 "seconds" worth of turns
      side: master.side,
      hasWeapon: false,
      weaponType: null,
      skill: null
    };
    
    return backup;
  }
  
  checkBackupArrival() {
    // Check if any backups should arrive this turn
    Object.entries(this.backupBrutes).forEach(([masterName, backup]) => {
      if (backup && !backup.active && this.currentTurn === backup.arrivesAtTurn) {
        // Check if master is still alive
        const master = masterName === this.fighter1.stats.name ? this.fighter1 : this.fighter2;
        if (master.stats.health > 0) {
          this.activateBackup(backup);
        }
      }
    });
    
    // Check if any active backups should leave
    this.activeBackups = this.activeBackups.filter(backup => {
      if (backup.remainingTime <= 0) {
        this.deactivateBackup(backup);
        return false;
      }
      return true;
    });
  }
  
  activateBackup(backup) {
    backup.active = true;
    backup.leavesAtTurn = this.currentTurn + Math.ceil(backup.remainingTime);
    this.activeBackups.push(backup);
    
    // Add combat step
    this.addCombatStep('backup_arrive', { 
      backup: backup.stats.name,
      master: backup.master.stats.name 
    });
    
    console.log(` ${backup.stats.name} arrives to help!`);
  }
  
  deactivateBackup(backup) {
    backup.active = false;
    
    // Add combat step
    this.addCombatStep('backup_leave', { 
      backup: backup.stats.name 
    });
    
    console.log(` ${backup.stats.name} leaves the battlefield!`);
  }
  
  handleBackupDamage(backup, damage) {
    // Instead of taking HP damage, reduce remaining time
    const timeReduction = damage * 0.05; // 5% per damage point
    backup.remainingTime = Math.max(0, backup.remainingTime - timeReduction);
    
    console.log(` ${backup.stats.name} time reduced by ${timeReduction.toFixed(2)} (${damage} damage)`);
  }
  
  getRandomTarget(attacker) {
    // Get all valid targets including active backups
    const targets = [];
    
    // Add main fighters
    if (attacker !== this.fighter1 && attacker.master !== this.fighter1 && this.fighter1.stats.health > 0) {
      targets.push(this.fighter1);
    }
    if (attacker !== this.fighter2 && attacker.master !== this.fighter2 && this.fighter2.stats.health > 0) {
      targets.push(this.fighter2);
    }
    
    // Add active backups from opposing team
    this.activeBackups.forEach(backup => {
      if (backup.master.side !== attacker.side && backup.active) {
        targets.push(backup);
      }
    });
    
    // Return random target or null if none available
    return targets.length > 0 ? targets[this.rng.int(0, targets.length - 1)] : null;
  }
  
  executeBackupActions() {
    // Give each active backup a chance to act (25% per turn)
    for (const backup of this.activeBackups) {
      if (this.rng.chance(0.25)) {
        const target = this.getRandomTarget(backup);
        if (target) {
          // Backup performs a simple attack
          const damage = Math.floor(backup.stats.strength * 0.8 + this.rng.float() * 10);
          
          if (target.isBackup) {
            this.handleBackupDamage(target, damage);
          } else {
            target.stats.health = Math.max(0, target.stats.health - damage);
          }
          
          // Add combat step
          this.addCombatStep('backup_attack', {
            attacker: backup.stats.name,
            target: target.stats.name,
            damage: damage
          });
          
          return {
            type: 'backup_attack',
            attacker: backup,
            target: target,
            hit: true,
            damage: damage,
            message: `⚔️ ${backup.stats.name} strikes ${target.stats.name} for ${damage} damage!`
          };
        }
      }
    }
    
    return null;
  }
}