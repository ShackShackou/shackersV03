/**
 * OFFICIAL LABRUTE FIGHT GENERATOR
 * This is the REAL engine that generates fights exactly like the original game
 * Based on: fichiers_labrute-officiel/labrute/server/src/utils/fight/
 */

const { getDamage } = require('../../../server/engine/labrute-official/getDamage');
const { weapons, getWeapon } = require('../../../server/engine/labrute-official/weapons');

/**
 * Generate a complete fight using official LaBrute rules
 */
async function generateOfficialFight(fighter1Data, fighter2Data) {
  console.log('🎯 Generating fight with OFFICIAL LaBrute engine');
  
  // Initialize fighters with official stats
  const fighters = [
    createOfficialFighter(fighter1Data, 0),
    createOfficialFighter(fighter2Data, 1),
  ];
  
  const steps = [];
  let turn = 0;
  const maxTurns = 500;
  
  // Add arrival steps
  steps.push({ type: 'arrive', fighter: 0 });
  steps.push({ type: 'arrive', fighter: 1 });
  
  // Main combat loop
  while (turn < maxTurns) {
    // Determine turn order based on initiative
    const turnOrder = determineTurnOrder(fighters);
    
    for (const fighterIndex of turnOrder) {
      const fighter = fighters[fighterIndex];
      const opponent = fighters[1 - fighterIndex];
      
      // Skip if fighter is dead
      if (fighter.hp <= 0) continue;
      
      // Fighter turn
      const turnSteps = playFighterTurn(fighter, opponent, fighterIndex);
      steps.push(...turnSteps);
      
      // Check for death
      if (opponent.hp <= 0) {
        steps.push({ type: 'death', fighter: 1 - fighterIndex });
        steps.push({ 
          type: 'end', 
          winner: fighterIndex,
          loser: 1 - fighterIndex 
        });
        
        return {
          steps,
          fighters,
          winner: fighter,
          loser: opponent,
        };
      }
    }
    
    turn++;
  }
  
  // Time out - fighter with more HP wins
  const winner = fighters[0].hp > fighters[1].hp ? 0 : 1;
  steps.push({ 
    type: 'end', 
    winner: winner,
    loser: 1 - winner 
  });
  
  return {
    steps,
    fighters,
    winner: fighters[winner],
    loser: fighters[1 - winner],
  };
}

/**
 * Create a fighter with official stats
 */
function createOfficialFighter(data, index) {
  const fighter = {
    index,
    id: data.id,
    name: data.name || `Fighter ${index + 1}`,
    level: data.level || 1,
    hp: data.hp || 100,
    maxHp: data.hp || 100,
    strength: data.strength || 10,
    agility: data.agility || 10,
    speed: data.speed || 10,
    endurance: data.endurance || 10,
    intelligence: data.intelligence || 10,
    willpower: data.willpower || 10,
    
    // Combat stats
    baseDamage: 5, // Base damage without weapon
    armor: 0, // Damage reduction
    initiative: 0,
    
    // Equipment
    weapons: data.weapons || [],
    activeWeapon: null,
    damagedWeapons: [],
    
    // Skills
    skills: data.skills || [],
    activeSkills: [],
    
    // Pets
    pets: data.pets || [],
    
    // Status
    stunned: false,
    poisoned: false,
    trapped: false,
    // Extended status effects
    poison: { damage: 0, turns: 0 },
    hypnotised: false,
    hasteTurns: 0,
    regeneration: { turns: 0, amount: 0 },
    shieldTurns: 0,
    surviveUsed: false,
    vampirism: data.skills?.includes('vampirism'),
  };
  
  // Set active weapon if available
  if (fighter.weapons.length > 0) {
    const weaponName = fighter.weapons[0];
    fighter.activeWeapon = getWeapon(weaponName);
  }
  
  // Calculate armor from skills
  fighter.armor = calculateArmor(fighter);
  
  return fighter;
}

/**
 * Calculate armor based on skills
 */
function calculateArmor(fighter) {
  let armor = 0;
  
  // Add armor from skills
  if (fighter.skills.includes('armor')) {
    armor += 0.25; // 25% damage reduction
  }
  if (fighter.skills.includes('toughened')) {
    armor += 0.10; // 10% damage reduction
  }
  
  // Cap at 75% reduction
  return Math.min(armor, 0.75);
}

/**
 * Determine turn order based on initiative
 */
function determineTurnOrder(fighters) {
  // Calculate initiative for each fighter
  const initiatives = fighters.map((f, i) => ({
    index: i,
    initiative: calculateInitiative(f),
  }));
  
  // Sort by initiative (higher goes first)
  initiatives.sort((a, b) => b.initiative - a.initiative);
  
  // Return fighter indices in order
  return initiatives.map(i => i.index);
}

/**
 * Calculate fighter initiative
 */
function calculateInitiative(fighter) {
  let initiative = fighter.speed;
  
  // Add weapon tempo bonus
  if (fighter.activeWeapon) {
    initiative += fighter.activeWeapon.tempo * 10;
  }
  
  // Add skill bonuses
  if (fighter.skills.includes('vitality')) {
    initiative += 5;
  }
  if (fighter.skills.includes('flashFlood')) {
    initiative += 10;
  }
  
  // Add randomness
  initiative += Math.random() * 20;
  
  return initiative;
}

/**
 * Handle status effects at the start of a fighter's turn
 * Returns object { skip: boolean, extra: boolean, dead: boolean }
 */
function processStatusEffects(fighter, fighterIndex, steps) {
  let skip = false;
  let extra = false;
  let dead = false;

  // Poison tick
  if (fighter.poison.turns > 0) {
    fighter.hp -= fighter.poison.damage;
    fighter.poison.turns--;
    steps.push({
      type: 'poison',
      fighter: fighterIndex,
      damage: fighter.poison.damage,
      targetHP: Math.max(0, fighter.hp),
    });

    if (fighter.poison.turns === 0) {
      steps.push({ type: 'skillExpire', fighter: fighterIndex, skill: 'poison' });
    }

    if (fighter.hp <= 0) {
      if (fighter.skills.includes('survive') && !fighter.surviveUsed) {
        fighter.hp = 1;
        fighter.surviveUsed = true;
        steps.push({ type: 'survive', fighter: fighterIndex, targetHP: 1 });
      } else {
        dead = true;
      }
    }
  }

  // Regeneration tick
  if (fighter.regeneration.turns > 0 && !dead) {
    const heal = fighter.regeneration.amount;
    fighter.hp = Math.min(fighter.maxHp, fighter.hp + heal);
    fighter.regeneration.turns--;
    steps.push({
      type: 'regeneration',
      fighter: fighterIndex,
      heal,
      targetHP: fighter.hp,
    });
    if (fighter.regeneration.turns === 0) {
      steps.push({ type: 'skillExpire', fighter: fighterIndex, skill: 'regeneration' });
    }
  }

  // Haste tick
  if (fighter.hasteTurns > 0 && !dead) {
    fighter.hasteTurns--;
    extra = true;
    steps.push({ type: 'haste', fighter: fighterIndex });
    if (fighter.hasteTurns === 0) {
      steps.push({ type: 'skillExpire', fighter: fighterIndex, skill: 'haste' });
    }
  }

  // Shield expiration
  if (fighter.shieldTurns > 0 && !dead) {
    fighter.shieldTurns--;
    if (fighter.shieldTurns === 0) {
      steps.push({ type: 'skillExpire', fighter: fighterIndex, skill: 'shield' });
    }
  }

  // Hypnotised state makes fighter skip turn
  if (fighter.hypnotised && !dead) {
    fighter.hypnotised = false;
    steps.push({ type: 'hypnotise', fighter: fighterIndex, skipped: true });
    skip = true;
  }

  return { skip, extra, dead };
}

/**
 * Play a fighter's turn
 */
function playFighterTurn(fighter, opponent, fighterIndex) {
  const steps = [];

  // Status effects and auto activations
  // Some skills activate automatically if available
  if (fighter.skills.includes('haste') && fighter.hasteTurns <= 0 && Math.random() < 0.1) {
    fighter.hasteTurns = 2;
    steps.push({ type: 'skillActivate', fighter: fighterIndex, skill: 'haste' });
  }
  if (fighter.skills.includes('regeneration') && fighter.regeneration.turns <= 0 && Math.random() < 0.1) {
    fighter.regeneration = { turns: 3, amount: 2 };
    steps.push({ type: 'skillActivate', fighter: fighterIndex, skill: 'regeneration' });
  }
  if (fighter.skills.includes('shield') && fighter.shieldTurns <= 0 && Math.random() < 0.1) {
    fighter.shieldTurns = 3;
    steps.push({ type: 'skillActivate', fighter: fighterIndex, skill: 'shield' });
  }

  const status = processStatusEffects(fighter, fighterIndex, steps);
  if (status.dead) {
    return steps;
  }
  if (status.skip) {
    return steps;
  }

  // Check if stunned
  if (fighter.stunned) {
    fighter.stunned = false;
    return steps;
  }
  
  // Move to opponent
  steps.push({ 
    type: 'move', 
    fighter: fighterIndex,
    target: 1 - fighterIndex 
  });
  
  // Attempt special actions before attack
  if (fighter.skills.includes('hypnotise') && Math.random() < 0.1) {
    const resisted = opponent.skills.includes('resist') && Math.random() < 0.5;
    if (resisted) {
      steps.push({ type: 'resist', fighter: 1 - fighterIndex, effect: 'hypnotise' });
    } else {
      opponent.hypnotised = true;
      steps.push({ type: 'hypnotise', fighter: fighterIndex, target: 1 - fighterIndex });
      return steps;
    }
  }

  const performAttack = () => {
    const hitResult = attemptHit(fighter, opponent);

    if (hitResult.hit) {
      const damageResult = getDamage(fighter, opponent);
      let damage = damageResult.damage;
      if (opponent.shieldTurns > 0) {
        damage = Math.floor(damage / 2);
      }
      opponent.hp -= damage;

      steps.push({
        type: 'hit',
        fighter: fighterIndex,
        target: 1 - fighterIndex,
        damage,
        critical: damageResult.criticalHit,
        weapon: fighter.activeWeapon?.name,
        targetHP: Math.max(0, opponent.hp),
      });

      if (fighter.vampirism) {
        const heal = Math.floor(damage * 0.5);
        fighter.hp = Math.min(fighter.maxHp, fighter.hp + heal);
        steps.push({ type: 'vampirism', fighter: fighterIndex, heal, targetHP: fighter.hp });
      }

      // Apply poison if available
      if ((fighter.skills.includes('poison') || fighter.activeWeapon?.poison) && opponent.poison.turns <= 0) {
        const resisted = opponent.skills.includes('resist') && Math.random() < 0.5;
        if (resisted) {
          steps.push({ type: 'resist', fighter: 1 - fighterIndex, effect: 'poison' });
        } else {
          opponent.poison = { damage: 2, turns: 3 };
          steps.push({ type: 'skillActivate', fighter: 1 - fighterIndex, skill: 'poison' });
        }
      }

      // Counter attack
      if (opponent.skills.includes('counterAttack') && Math.random() < 0.3) {
        const counterDamage = Math.floor(damage * 0.5);
        fighter.hp -= counterDamage;

        steps.push({
          type: 'counter',
          fighter: 1 - fighterIndex,
          target: fighterIndex,
          damage: counterDamage,
          targetHP: Math.max(0, fighter.hp),
        });
      }
    } else if (hitResult.evaded) {
      steps.push({ type: 'evade', fighter: 1 - fighterIndex });
    } else if (hitResult.blocked) {
      steps.push({ type: 'block', fighter: 1 - fighterIndex, damage: 0 });
    } else {
      steps.push({ type: 'miss', fighter: fighterIndex, target: 1 - fighterIndex });
    }
  };

  // Throw weapon
  if (fighter.skills.includes('throw') && fighter.activeWeapon && Math.random() < 0.1) {
    steps.push({ type: 'throw', fighter: fighterIndex, target: 1 - fighterIndex, weapon: fighter.activeWeapon.name });
    performAttack();
    fighter.damagedWeapons.push(fighter.activeWeapon);
    fighter.activeWeapon = null;
  } else {
    performAttack();
    if (status.extra) {
      performAttack();
    }
  }

  // Survive check for opponent
  if (opponent.hp <= 0 && opponent.skills.includes('survive') && !opponent.surviveUsed) {
    opponent.hp = 1;
    opponent.surviveUsed = true;
    steps.push({ type: 'survive', fighter: 1 - fighterIndex, targetHP: 1 });
  }

  // Move back
  steps.push({
    type: 'moveBack',
    fighter: fighterIndex,
  });

  return steps;
}

/**
 * Attempt to hit an opponent
 */
function attemptHit(fighter, opponent) {
  // Base hit chance
  let hitChance = 0.5;
  
  // Add accuracy from weapon
  if (fighter.activeWeapon) {
    hitChance += fighter.activeWeapon.accuracy * 0.3;
  }
  
  // Add agility difference
  hitChance += (fighter.agility - opponent.agility) * 0.02;
  
  // Check for evasion
  let evadeChance = 0.1;
  evadeChance += opponent.agility * 0.01;
  if (opponent.activeWeapon) {
    evadeChance += opponent.activeWeapon.evasion * 0.2;
  }
  
  // Check for block
  let blockChance = 0.1;
  if (opponent.activeWeapon) {
    blockChance += opponent.activeWeapon.block * 0.3;
  }
  if (opponent.skills.includes('block')) {
    blockChance += 0.2;
  }
  
  // Roll the dice
  const roll = Math.random();
  
  if (roll < evadeChance) {
    return { hit: false, evaded: true };
  }
  if (roll < evadeChance + blockChance) {
    return { hit: false, blocked: true };
  }
  if (roll < hitChance) {
    return { hit: true };
  }
  
  return { hit: false };
}

module.exports = {
  generateOfficialFight,
};