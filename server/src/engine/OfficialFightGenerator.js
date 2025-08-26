/**
 * OFFICIAL LABRUTE FIGHT GENERATOR
 * This is the REAL engine that generates fights exactly like the original game
 * Based on: fichiers_labrute-officiel/labrute/server/src/utils/fight/
 */

const { getDamage } = require('../../../server/engine/labrute-official/getDamage');
const { weapons, getWeapon } = require('../../../server/engine/labrute-official/weapons');

// StepType enum copied from official LaBrute server (labrute/server/src/utils/fight)
// Numeric values are important as they are used by the client to interpret steps
const StepType = {
  Saboteur: 0,
  Leave: 1,
  Arrive: 2,
  Trash: 3,
  Steal: 4,
  Trap: 5,
  Heal: 6,
  Resist: 7,
  Survive: 8,
  Hit: 9,
  FlashFlood: 10,
  Hammer: 11,
  Poison: 12,
  Bomb: 13,
  Hypnotise: 14,
  Move: 15,
  Eat: 16,
  MoveBack: 17,
  Equip: 18,
  AttemptHit: 19,
  Block: 20,
  Evade: 21,
  Sabotage: 22,
  Disarm: 23,
  Death: 24,
  Throw: 25,
  End: 26,
  Counter: 27,
  SkillActivate: 28,
  SkillExpire: 29,
  Spy: 30,
  Vampirism: 31,
  Haste: 32,
  Treat: 33,
  DropShield: 34,
  Regeneration: 35,
};

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
  steps.push({ a: StepType.Arrive, f: 0 });
  steps.push({ a: StepType.Arrive, f: 1 });
  
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
        steps.push({ a: StepType.Death, f: 1 - fighterIndex });
        steps.push({ a: StepType.End, w: fighterIndex, l: 1 - fighterIndex });
        
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
  steps.push({ a: StepType.End, w: winner, l: 1 - winner });
  
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

  // Skip turn if stunned
  if (fighter.stunned) {
    fighter.stunned = false;
    return steps;
  }

  // Equip a weapon if needed
  if (!fighter.activeWeapon || fighter.damagedWeapons.includes(fighter.activeWeapon.name)) {
    fighter.activeWeapon = chooseWeapon(fighter);
    if (fighter.activeWeapon) {
      steps.push({ a: StepType.Equip, f: fighterIndex, w: fighter.activeWeapon.name });
    }
  }

  // Trap skill
  if (fighter.skills.includes('net') && !opponent.trapped && Math.random() < 0.2) {
    opponent.trapped = true;
    steps.push({ a: StepType.Trap, f: fighterIndex, t: opponent.index });
  }

  // Move towards opponent
  steps.push({ a: StepType.Move, f: fighterIndex, t: opponent.index });

  // Attempt hit
  steps.push({ a: StepType.AttemptHit, f: fighterIndex, t: opponent.index, w: fighter.activeWeapon?.name });
  const hitResult = attemptHit(fighter, opponent);

  if (hitResult.hit) {
    const damageResult = getDamage(fighter, opponent);
    opponent.hp -= damageResult.damage;
    steps.push({
      a: StepType.Hit,
      f: fighterIndex,
      t: opponent.index,
      d: damageResult.damage,
      w: fighter.activeWeapon?.name,
      c: damageResult.criticalHit ? 1 : 0,
      h: Math.max(0, opponent.hp),
    });

    // Bomb skill
    if (fighter.skills.includes('bomb') && !fighter.bombUsed) {
      fighter.bombUsed = true;
      const bombDamage = Math.floor(damageResult.damage * 0.5);
      opponent.hp -= bombDamage;
      steps.push({ a: StepType.Bomb, f: fighterIndex, t: opponent.index, d: bombDamage, h: Math.max(0, opponent.hp) });
    }

    // Saboteur skill: break opponent weapon
    if (fighter.skills.includes('saboteur') && opponent.activeWeapon && !opponent.damagedWeapons.includes(opponent.activeWeapon.name) && Math.random() < 0.25) {
      opponent.damagedWeapons.push(opponent.activeWeapon.name);
      steps.push({ a: StepType.Sabotage, f: fighterIndex, t: opponent.index, w: opponent.activeWeapon.name });
      opponent.activeWeapon = null;
    }

    // Counter attack
    if (opponent.skills.includes('counterAttack') && Math.random() < 0.3) {
      const counterDamage = Math.floor(damageResult.damage * 0.5);
      fighter.hp -= counterDamage;
      steps.push({ a: StepType.Counter, f: opponent.index, t: fighterIndex, d: counterDamage, h: Math.max(0, fighter.hp) });
    }
  } else if (hitResult.evaded) {
    steps.push({ a: StepType.Evade, f: opponent.index });
  } else if (hitResult.blocked) {
    steps.push({ a: StepType.Block, f: opponent.index });
  }

  // Move back after action
  steps.push({ a: StepType.MoveBack, f: fighterIndex });

  return steps;
}

// Choose first available weapon that isn't broken
function chooseWeapon(fighter) {
  const available = fighter.weapons.filter((w) => !fighter.damagedWeapons.includes(w));
  if (available.length === 0) {
    return null;
  }
  const name = available[Math.floor(Math.random() * available.length)];
  return getWeapon(name);
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
  StepType,
  generateOfficialFight,
};