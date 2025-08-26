/**
 * OFFICIAL LABRUTE FIGHT GENERATOR
 * This is the REAL engine that generates fights exactly like the original game
 * Based on: fichiers_labrute-officiel/labrute/server/src/utils/fight/
 */

const { getDamage } = require('../../../server/engine/labrute-official/getDamage');
const { getFighterStat } = require('../../../server/engine/labrute-official/getFighterStat');
const { SkillModifiers } = require('../../../server/engine/labrute-official/skillModifiers');
const { weapons, getWeapon } = require('../../../server/engine/labrute-official/weapons');
const { RNG } = require('../../../server/engine/labrute-official/rng');

/**
 * Generate a complete fight using official LaBrute rules
 */
async function generateOfficialFight(fighter1Data, fighter2Data, seed = Date.now()) {
  console.log('🎯 Generating fight with OFFICIAL LaBrute engine');

  const rng = new RNG(seed);
  
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
    const turnOrder = determineTurnOrder(fighters, rng);
    
    for (const fighterIndex of turnOrder) {
      const fighter = fighters[fighterIndex];
      const opponent = fighters[1 - fighterIndex];
      
      // Skip if fighter is dead
      if (fighter.hp <= 0) continue;
      
      // Fighter turn
      const turnSteps = playFighterTurn(fighter, opponent, fighterIndex, rng);
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
function determineTurnOrder(fighters, rng) {
  // Calculate initiative for each fighter
  const initiatives = fighters.map((f, i) => ({
    index: i,
    initiative: calculateInitiative(f, rng),
  }));
  
  // Sort by initiative (higher goes first)
  initiatives.sort((a, b) => b.initiative - a.initiative);
  
  // Return fighter indices in order
  return initiatives.map(i => i.index);
}

/**
 * Calculate fighter initiative
 */
function calculateInitiative(fighter, rng) {
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
  initiative += rng.float() * 20;
  
  return initiative;
}

/**
 * Play a fighter's turn
 */
function playFighterTurn(fighter, opponent, fighterIndex, rng) {
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
  const hitResult = attemptHit(fighter, opponent, rng);
  
  if (hitResult.hit) {
    // Calculate damage using official formula
    const damageResult = getDamage(fighter, opponent, null, rng);
    
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
    
    // Check for counter attack
    const counterChance = getFighterStat(opponent, 'COUNTER');
    if (rng.float() < counterChance) {
      const counterResult = getDamage(opponent, fighter, null, rng);
      fighter.hp -= counterResult.damage;

      steps.push({
        type: 'counter',
        fighter: 1 - fighterIndex,
        target: fighterIndex,
        damage: counterResult.damage,
        critical: counterResult.criticalHit,
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
function attemptHit(fighter, opponent, rng) {
  // Check evasion using official formula
  const evaded = checkEvade(fighter, opponent, rng);
  if (evaded) {
    return { hit: false, evaded: true };
  }

  // Check block using official formula
  const blocked = checkBlock(fighter, opponent, rng);
  if (blocked) {
    return { hit: false, blocked: true };
  }

  // Hit lands
  return { hit: true };
}

function checkBlock(fighter, opponent, rng, thrown = false) {
  if (opponent.hp <= 0 || opponent.trapped || opponent.stunned) return false;

  let opponentBlock = getFighterStat(opponent, 'BLOCK');

  // Hideaway bonus against thrown weapons
  if (thrown && opponent.skills.includes('hideaway')) {
    opponentBlock += SkillModifiers.hideaway?.BLOCK?.percent || 0;
  }

  // Survival bonus at 1 HP
  if (opponent.hp === 1 && opponent.skills.includes('survival')) {
    opponentBlock += SkillModifiers.survival?.BLOCK?.percent || 0;
  }

  const threshold = Math.min(opponentBlock - getFighterStat(fighter, 'ACCURACY'), 0.9);
  return rng.float() < threshold;
}

function checkEvade(fighter, opponent, rng, difficulty = 1) {
  if (opponent.hp <= 0 || opponent.trapped || opponent.stunned) return false;

  // Ballet shoes auto-evade once
  if (opponent.balletShoes) {
    opponent.balletShoes = false;
    return true;
  }

  let opponentEvasion = getFighterStat(opponent, 'EVASION');

  // Survival bonus at 1 HP
  if (opponent.hp === 1 && opponent.skills.includes('survival')) {
    opponentEvasion += SkillModifiers.survival?.EVASION?.percent || 0;
  }

  const agilityDiff = Math.min(Math.max(-40, (opponent.agility - fighter.agility) * 2), 40);
  const threshold = Math.min(
    opponentEvasion + agilityDiff * 0.01 - getFighterStat(fighter, 'ACCURACY') - getFighterStat(fighter, 'DEXTERITY'),
    0.9 * difficulty,
  );
  return rng.float() * difficulty < threshold;
}

module.exports = {
  generateOfficialFight,
};