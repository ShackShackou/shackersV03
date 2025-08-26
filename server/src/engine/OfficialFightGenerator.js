/**
 * OFFICIAL LABRUTE FIGHT GENERATOR
 * This is the REAL engine that generates fights exactly like the original game
 * Based on: fichiers_labrute-officiel/labrute/server/src/utils/fight/
 */

const { getDamage } = require('../../../server/engine/labrute-official/getDamage');
const { weapons, getWeapon } = require('../../../server/engine/labrute-official/weapons');

// Default durations and bonuses for temporary skills
const STATUS_DURATIONS = {
  poison: 3,
  regeneration: 3,
  vampirism: 3,
  haste: 2,
};

const HASTE_SPEED_BONUS = 10;

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

  // Activate any ongoing skills at the start of the fight
  initializeStatuses(fighters, steps);

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

        // Check for deaths on both sides
        if (fighter.hp <= 0 || opponent.hp <= 0) {
          if (fighter.hp <= 0) {
            steps.push({ type: 'death', fighter: fighterIndex });
          }
          if (opponent.hp <= 0) {
            steps.push({ type: 'death', fighter: 1 - fighterIndex });
          }

          const winnerIndex = fighter.hp > opponent.hp ? fighterIndex : 1 - fighterIndex;
          steps.push({
            type: 'end',
            winner: winnerIndex,
            loser: 1 - winnerIndex
          });

          return {
            steps,
            fighters,
            winner: fighters[winnerIndex],
            loser: fighters[1 - winnerIndex],
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
    trapped: false,
    statuses: {
      poison: 0,
      regeneration: 0,
      vampirism: 0,
      haste: 0,
      hasteBonus: 0,
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

// Activate starting statuses based on fighter skills
function initializeStatuses(fighters, steps) {
  fighters.forEach(f => {
    if (f.skills.includes('regeneration')) {
      applyStatus(f, 'regeneration', steps);
    }
    if (f.skills.includes('vampirism')) {
      applyStatus(f, 'vampirism', steps);
    }
    if (f.skills.includes('haste')) {
      applyStatus(f, 'haste', steps);
    }
  });
}

// Apply a status to a fighter
function applyStatus(fighter, status, steps) {
  const duration = STATUS_DURATIONS[status] || 0;
  if (duration <= 0) return;

  fighter.statuses[status] = duration;

  if (status === 'haste') {
    fighter.speed += HASTE_SPEED_BONUS;
    fighter.statuses.hasteBonus = HASTE_SPEED_BONUS;
  }

  steps.push({ type: 'skillActivate', fighter: fighter.index, skill: status });
}

// Process ongoing status effects at the start of a fighter's turn
function processStatuses(fighter, steps) {
  // Poison damages the fighter
  if (fighter.statuses.poison > 0) {
    const damage = 5;
    fighter.hp -= damage;
    fighter.statuses.poison--;
    steps.push({
      type: 'poison',
      fighter: fighter.index,
      damage,
      targetHP: Math.max(0, fighter.hp),
    });
    if (fighter.statuses.poison === 0) {
      steps.push({ type: 'skillExpire', fighter: fighter.index, skill: 'poison' });
    }
  }

  // Regeneration heals the fighter
  if (fighter.statuses.regeneration > 0) {
    const heal = 5;
    fighter.hp = Math.min(fighter.maxHp, fighter.hp + heal);
    fighter.statuses.regeneration--;
    steps.push({
      type: 'regeneration',
      fighter: fighter.index,
      amount: heal,
      targetHP: Math.min(fighter.maxHp, fighter.hp),
    });
    if (fighter.statuses.regeneration === 0) {
      steps.push({ type: 'skillExpire', fighter: fighter.index, skill: 'regeneration' });
    }
  }

  // Vampirism just decrements its duration here
  if (fighter.statuses.vampirism > 0) {
    fighter.statuses.vampirism--;
    if (fighter.statuses.vampirism === 0) {
      steps.push({ type: 'skillExpire', fighter: fighter.index, skill: 'vampirism' });
    }
  }

  // Haste decreases duration and removes bonus when done
  if (fighter.statuses.haste > 0) {
    fighter.statuses.haste--;
    if (fighter.statuses.haste === 0) {
      fighter.speed -= fighter.statuses.hasteBonus || 0;
      fighter.statuses.hasteBonus = 0;
      steps.push({ type: 'skillExpire', fighter: fighter.index, skill: 'haste' });
    }
  }
}

/**
 * Play a fighter's turn
 */
function playFighterTurn(fighter, opponent, fighterIndex) {
  const steps = [];

  // Apply ongoing status effects
  processStatuses(fighter, steps);
  if (fighter.hp <= 0) {
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

    // Apply poison on hit if fighter has the skill
    if (fighter.skills.includes('poison') && opponent.statuses.poison === 0) {
      applyStatus(opponent, 'poison', steps);
    }

    // Vampirism heals the attacker based on damage dealt
    if (fighter.statuses.vampirism > 0) {
      const heal = Math.floor(damageResult.damage * 0.5);
      fighter.hp = Math.min(fighter.maxHp, fighter.hp + heal);
      steps.push({
        type: 'vampirism',
        fighter: fighterIndex,
        amount: heal,
        targetHP: Math.min(fighter.maxHp, fighter.hp),
      });
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

module.exports = {
  generateOfficialFight,
};