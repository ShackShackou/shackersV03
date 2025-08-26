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

  // Activate starting status skills
  fighters.forEach((f) => activateStatusSkills(f, steps));
  
  // Main combat loop
  while (turn < maxTurns) {
    // Determine turn order based on initiative
    const turnOrder = determineTurnOrder(fighters);
    
    for (const fighterIndex of turnOrder) {
      const fighter = fighters[fighterIndex];
      const opponent = fighters[1 - fighterIndex];

      // Skip if fighter is dead
      if (fighter.hp <= 0) continue;

      // Apply ongoing statuses
      handleStatusEffects(fighter, steps);

      // Check if fighter died from status effect
      if (fighter.hp <= 0) {
        steps.push({ type: 'death', fighter: fighterIndex });
        steps.push({
          type: 'end',
          winner: 1 - fighterIndex,
          loser: fighterIndex
        });

        return {
          steps,
          fighters,
          winner: opponent,
          loser: fighter,
        };
      }

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
    statuses: {
      poison: null,
      regeneration: null,
      vampirism: null,
      haste: null,
    },
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
 * Play a fighter's turn
 */
function playFighterTurn(fighter, opponent, fighterIndex) {
  const steps = [];
  
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
  
  // Attempt to hit
  const hitResult = attemptHit(fighter, opponent);
  
  if (hitResult.hit) {
    // Calculate damage using official formula
    const damageResult = getDamage(fighter, opponent);
    
    // Apply damage
    opponent.hp -= damageResult.damage;
    
    steps.push({
      type: 'hit',
      fighter: fighterIndex,
      target: 1 - fighterIndex,
      damage: damageResult.damage,
      critical: damageResult.criticalHit,
      weapon: fighter.activeWeapon?.name,
      targetHP: Math.max(0, opponent.hp),
    });

    // Apply vampirism heal if active
    if (fighter.statuses.vampirism) {
      const healAmount = Math.ceil(damageResult.damage * fighter.statuses.vampirism.steal);
      fighter.hp = Math.min(fighter.maxHp, fighter.hp + healAmount);
      steps.push({
        type: 'vampirism',
        fighter: fighterIndex,
        heal: healAmount,
        targetHP: fighter.hp,
      });
    }

    // Inflict poison if fighter has poison skill
    if (fighter.skills.includes('poison') && !opponent.statuses.poison) {
      const poisonDamage = Math.ceil(opponent.maxHp * 0.05);
      opponent.statuses.poison = { duration: 3, damage: poisonDamage };
      steps.push({ type: 'skillActivate', fighter: 1 - fighterIndex, skill: 'poison' });
    }
    
    // Check for counter attack
    if (opponent.skills.includes('counterAttack') && Math.random() < 0.3) {
      const counterDamage = Math.floor(damageResult.damage * 0.5);
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
    steps.push({
      type: 'evade',
      fighter: 1 - fighterIndex,
    });
  } else if (hitResult.blocked) {
    steps.push({
      type: 'block',
      fighter: 1 - fighterIndex,
      damage: 0,
    });
  } else {
    steps.push({
      type: 'miss',
      fighter: fighterIndex,
      target: 1 - fighterIndex,
    });
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

/**
 * Activate passive status skills at start of fight
 */
function activateStatusSkills(fighter, steps) {
  if (fighter.skills.includes('regeneration') && !fighter.statuses.regeneration) {
    fighter.statuses.regeneration = {
      duration: 3,
      heal: Math.ceil(fighter.maxHp * 0.05),
    };
    steps.push({ type: 'skillActivate', fighter: fighter.index, skill: 'regeneration' });
  }

  if (fighter.skills.includes('vampirism') && !fighter.statuses.vampirism) {
    fighter.statuses.vampirism = {
      duration: 3,
      steal: 0.3,
    };
    steps.push({ type: 'skillActivate', fighter: fighter.index, skill: 'vampirism' });
  }

  if (fighter.skills.includes('haste') && !fighter.statuses.haste) {
    const speedBonus = 10;
    fighter.speed += speedBonus;
    fighter.statuses.haste = {
      duration: 3,
      speed: speedBonus,
    };
    steps.push({ type: 'skillActivate', fighter: fighter.index, skill: 'haste' });
  }
}

/**
 * Handle status effects at the start of a fighter's turn
 */
function handleStatusEffects(fighter, steps) {
  const status = fighter.statuses;

  if (status.poison) {
    fighter.hp -= status.poison.damage;
    steps.push({
      type: 'poison',
      fighter: fighter.index,
      damage: status.poison.damage,
      targetHP: Math.max(0, fighter.hp),
    });
    status.poison.duration--;
    if (status.poison.duration <= 0) {
      steps.push({ type: 'skillExpire', fighter: fighter.index, skill: 'poison' });
      status.poison = null;
    }
  }

  if (status.regeneration) {
    fighter.hp = Math.min(fighter.maxHp, fighter.hp + status.regeneration.heal);
    steps.push({
      type: 'regeneration',
      fighter: fighter.index,
      heal: status.regeneration.heal,
      targetHP: fighter.hp,
    });
    status.regeneration.duration--;
    if (status.regeneration.duration <= 0) {
      steps.push({ type: 'skillExpire', fighter: fighter.index, skill: 'regeneration' });
      status.regeneration = null;
    }
  }

  if (status.vampirism) {
    status.vampirism.duration--;
    if (status.vampirism.duration <= 0) {
      steps.push({ type: 'skillExpire', fighter: fighter.index, skill: 'vampirism' });
      status.vampirism = null;
    }
  }

  if (status.haste) {
    status.haste.duration--;
    if (status.haste.duration <= 0) {
      fighter.speed -= status.haste.speed;
      steps.push({ type: 'skillExpire', fighter: fighter.index, skill: 'haste' });
      status.haste = null;
    }
  }
}

module.exports = {
  generateOfficialFight,
};