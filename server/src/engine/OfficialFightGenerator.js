/**
 * OFFICIAL LABRUTE FIGHT GENERATOR
 * This is the REAL engine that generates fights exactly like the original game
 * Based on: fichiers_labrute-officiel/labrute/server/src/utils/fight/
 */

const { getDamage } = require('../../../server/engine/labrute-official/getDamage');
const { getWeapon } = require('../../../server/engine/labrute-official/weapons');
const { attemptHit } = require('../../../server/engine/labrute-official/attemptHit');
const { seedRandom } = require('../../../server/engine/labrute-official/seedRandom');

/**
 * Generate a complete fight using official LaBrute rules
 */
async function generateOfficialFight(fighter1Data, fighter2Data, seed = Date.now()) {
  console.log('🎯 Generating fight with OFFICIAL LaBrute engine');

  // Seed RNG for deterministic fights
  const originalRandom = Math.random;
  Math.random = seedRandom(seed);
  
  try {
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
            seed,
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
      seed,
    };
  } finally {
    Math.random = originalRandom;
  }
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
      } else if (hitResult.counter) {
        // Opponent counter-attacks
        const counterDamage = getDamage(opponent, fighter);
        fighter.hp -= counterDamage.damage;

        steps.push({
          type: 'counter',
          fighter: 1 - fighterIndex,
          target: fighterIndex,
          damage: counterDamage.damage,
          critical: counterDamage.criticalHit,
          weapon: opponent.activeWeapon?.name,
          targetHP: Math.max(0, fighter.hp),
        });
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

module.exports = {
  generateOfficialFight,
};