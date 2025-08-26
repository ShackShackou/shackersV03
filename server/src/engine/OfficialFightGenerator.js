/**
 * OFFICIAL LABRUTE FIGHT GENERATOR
 * This is the REAL engine that generates fights exactly like the original game
 * Based on: fichiers_labrute-officiel/labrute/server/src/utils/fight/
 */

const { getDamage } = require('../../../server/engine/labrute-official/getDamage');
const { weapons, getWeapon } = require('../../../server/engine/labrute-official/weapons');

/**
 * Get base tempo from speed (lower is faster)
 */
function getBaseTempo(speed) {
  return 0.10 + (20 / (10 + (speed * 1.5))) * 0.90;
}

/**
 * Compute action tempo using fighter speed and weapon tempo
 */
function getActionTempo(fighter) {
  const base = fighter.tempo || getBaseTempo(fighter.speed);
  const weaponTempo = fighter.activeWeapon?.tempo || 1;
  return base * weaponTempo;
}

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

  // Initialize next action time for each fighter
  fighters.forEach((f) => {
    f.nextAction = getActionTempo(f);
  });

  const steps = [];
  let turn = 0;
  const maxTurns = 500;
  let fightTempo = 0;

  // Add arrival steps at tempo 0
  steps.push({ type: 'arrive', fighter: 0, tempo: 0 });
  steps.push({ type: 'arrive', fighter: 1, tempo: 0 });

  // Main combat loop using tempo
  while (turn < maxTurns) {
    // Select fighter with lowest next action tempo
    let fighterIndex = fighters[0].nextAction <= fighters[1].nextAction ? 0 : 1;
    if (fighters[0].nextAction === fighters[1].nextAction && Math.random() < 0.5) {
      fighterIndex = 1;
    }

    const fighter = fighters[fighterIndex];
    const opponent = fighters[1 - fighterIndex];

    // Update current fight tempo
    fightTempo = fighter.nextAction;

    // Skip if fighter is dead
    if (fighter.hp <= 0) {
      fighter.nextAction += getActionTempo(fighter);
      continue;
    }

    // Fighter turn
    const turnSteps = playFighterTurn(fighter, opponent, fighterIndex, fightTempo);
    steps.push(...turnSteps);

    // Check for death
    if (opponent.hp <= 0) {
      steps.push({ type: 'death', fighter: 1 - fighterIndex, tempo: fightTempo });
      steps.push({
        type: 'end',
        winner: fighterIndex,
        loser: 1 - fighterIndex,
        tempo: fightTempo,
      });

      return {
        steps,
        fighters,
        winner: fighter,
        loser: opponent,
      };
    }

    // Schedule next action for fighter based on tempo
    fighter.nextAction += getActionTempo(fighter);
    turn++;
  }

  // Time out - fighter with more HP wins
  const winner = fighters[0].hp > fighters[1].hp ? 0 : 1;
  steps.push({
    type: 'end',
    winner: winner,
    loser: 1 - winner,
    tempo: fightTempo,
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
  const speed = data.speed || 10;
  const fighter = {
    index,
    id: data.id,
    name: data.name || `Fighter ${index + 1}`,
    level: data.level || 1,
    hp: data.hp || 100,
    maxHp: data.hp || 100,
    strength: data.strength || 10,
    agility: data.agility || 10,
    speed,
    endurance: data.endurance || 10,
    intelligence: data.intelligence || 10,
    willpower: data.willpower || 10,

    // Combat stats
    baseDamage: 5, // Base damage without weapon
    armor: 0, // Damage reduction
    initiative: 0,
    tempo: getBaseTempo(speed),
    nextAction: 0,
    
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
/**
 * Play a fighter's turn
 */
function playFighterTurn(fighter, opponent, fighterIndex, tempo) {
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
    target: 1 - fighterIndex,
    tempo,
  });

  // Attempt to hit
  const hitResult = attemptHit(fighter, opponent);

  if (hitResult.hit) {
    // Calculate damage using official formula
    const damageResult = getDamage(fighter, opponent);

    steps.push({
      type: 'hit',
      fighter: fighterIndex,
      target: 1 - fighterIndex,
      damage: damageResult.damage,
      critical: damageResult.criticalHit,
      weapon: fighter.activeWeapon?.name,
      tempo,
    });

    // Apply damage and record HP change
    opponent.hp -= damageResult.damage;
    steps.push({
      type: 'hp',
      fighter: 1 - fighterIndex,
      hp: Math.max(0, opponent.hp),
      tempo,
    });

    // Check for counter attack
    if (opponent.skills.includes('counterAttack') && Math.random() < 0.3) {
      const counterDamage = Math.floor(damageResult.damage * 0.5);
      steps.push({
        type: 'counter',
        fighter: 1 - fighterIndex,
        target: fighterIndex,
        damage: counterDamage,
        tempo,
      });

      fighter.hp -= counterDamage;
      steps.push({
        type: 'hp',
        fighter: fighterIndex,
        hp: Math.max(0, fighter.hp),
        tempo,
      });
    }
  } else if (hitResult.evaded) {
    steps.push({
      type: 'evade',
      fighter: 1 - fighterIndex,
      tempo,
    });
  } else if (hitResult.blocked) {
    steps.push({
      type: 'block',
      fighter: 1 - fighterIndex,
      damage: 0,
      tempo,
    });
  } else {
    steps.push({
      type: 'miss',
      fighter: fighterIndex,
      target: 1 - fighterIndex,
      tempo,
    });
  }

  // Move back
  steps.push({
    type: 'moveBack',
    fighter: fighterIndex,
    tempo,
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