/**
 * OFFICIAL LABRUTE FIGHT GENERATOR
 * This is the REAL engine that generates fights exactly like the original game
 * Based on: fichiers_labrute-officiel/labrute/server/src/utils/fight/
 */

const { getDamage } = require('../../../server/engine/labrute-official/getDamage');
const { weapons, getWeapon } = require('../../../server/engine/labrute-official/weapons');
const { StepType } = require('../../../server/engine/labrute-core/constants');

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
    poisonCounter: 0,
    poisoner: null,
    trapped: false,
    hypnotized: false,
    shield: data.skills?.includes('shield') || false,
    survival: data.skills?.includes('survival') || false,
    resistant: data.skills?.includes('resistant') || false,
    vampirism: data.skills?.includes('vampirism') || false,
    haste: data.skills?.includes('haste') || false,
    flashFlood: data.skills?.includes('flashFlood') || false,
    hammer: data.skills?.includes('hammer') || false,
    hypnosis: data.skills?.includes('hypnosis') || false,
    treat: data.skills?.includes('treat') || false,
    regeneration: data.skills?.includes('regeneration') || false,
    spy: data.skills?.includes('spy') || false,
    skillUses: {},
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

  // Apply poison damage at the start of the turn
  applyPoisonTick(fighter, steps);
  if (fighter.hp <= 0) {
    steps.push({ type: StepType.Death, fighter: fighterIndex });
    return steps;
  }

  // Regeneration
  if (fighter.regeneration && fighter.hp < fighter.maxHp) {
    const heal = Math.max(1, Math.floor(fighter.maxHp / 20));
    healFighter(fighter, heal, steps, StepType.Regeneration);
  }

  // Skip if stunned or hypnotized
  if (fighter.stunned || fighter.hypnotized) {
    fighter.stunned = false;
    fighter.hypnotized = false;
    return steps;
  }

  // Spy skill : swap weapons once
  if (fighter.spy && !fighter.skillUses.spy && opponent.activeWeapon) {
    fighter.skillUses.spy = true;
    const temp = fighter.activeWeapon;
    fighter.activeWeapon = opponent.activeWeapon;
    opponent.activeWeapon = temp;
    steps.push({ type: StepType.Spy, fighter: fighterIndex, target: 1 - fighterIndex });
  }

  // Treat skill : heal instead of attacking
  if (fighter.treat && !fighter.skillUses.treat && fighter.hp < fighter.maxHp * 0.7) {
    fighter.skillUses.treat = true;
    activateSkill(fighter, 'treat', steps);
    const heal = Math.ceil(fighter.maxHp * 0.2);
    healFighter(fighter, heal, steps, StepType.Treat);
    expireSkill(fighter, 'treat', steps);
    return steps;
  }

  // Hypnosis : skip opponent next turn
  if (fighter.hypnosis && !fighter.skillUses.hypnosis && Math.random() < 0.2) {
    fighter.skillUses.hypnosis = true;
    activateSkill(fighter, 'hypnosis', steps);
    opponent.hypnotized = true;
    steps.push({ type: StepType.Hypnotise, fighter: fighterIndex, target: 1 - fighterIndex });
    expireSkill(fighter, 'hypnosis', steps);
    return steps;
  }

  // Move to opponent
  steps.push({
    type: StepType.Move,
    fighter: fighterIndex,
    target: 1 - fighterIndex
  });

  // Determine attack type
  let attackType = StepType.Hit;
  let usedSkill = null;
  if (fighter.flashFlood && !fighter.skillUses.flashFlood && Math.random() < 0.2) {
    attackType = StepType.FlashFlood;
    fighter.skillUses.flashFlood = true;
    usedSkill = 'flashFlood';
  } else if (fighter.hammer && Math.random() < 0.2) {
    attackType = StepType.Hammer;
    usedSkill = 'hammer';
  } else if (fighter.haste && !fighter.skillUses.haste && Math.random() < 0.2) {
    attackType = StepType.Haste;
    fighter.skillUses.haste = true;
    usedSkill = 'haste';
  } else if (fighter.vampirism && !fighter.skillUses.vampirism && Math.random() < 0.2) {
    attackType = StepType.Vampirism;
    fighter.skillUses.vampirism = true;
    usedSkill = 'vampirism';
  } else if (fighter.activeWeapon && fighter.activeWeapon.types?.includes('thrown') && Math.random() < 0.2) {
    attackType = StepType.Throw;
  }

  if (usedSkill) {
    activateSkill(fighter, usedSkill, steps);
  }

  // Attempt to hit
  const hitResult = attemptHit(fighter, opponent);

  if (hitResult.hit) {
    // Calculate damage using official formula
    const damageResult = getDamage(fighter, opponent);

    // Apply damage with resist/survive logic
    const actualDamage = applyDamage(opponent, damageResult.damage, steps, fighterIndex, attackType);

    const hitStep = {
      type: attackType,
      fighter: fighterIndex,
      target: 1 - fighterIndex,
      damage: actualDamage,
      critical: damageResult.criticalHit,
      weapon: fighter.activeWeapon?.name,
      targetHP: Math.max(0, opponent.hp),
    };

    // Special cases
    if (attackType === StepType.Vampirism) {
      const heal = Math.min(actualDamage, fighter.maxHp - fighter.hp);
      if (heal > 0) {
        fighter.hp += heal;
      }
      hitStep.heal = heal;
    }

    steps.push(hitStep);

    // Hammer stuns
    if (attackType === StepType.Hammer) {
      opponent.stunned = true;
    }

    // Apply poison on hit if skill
    if ((fighter.skills.includes('tragicPotion') || fighter.activeWeapon?.name === 'sai') && opponent.poisonCounter === 0) {
      opponent.poisonCounter = 3;
      opponent.poisonDamage = Math.max(1, Math.floor(opponent.maxHp / 20));
      opponent.poisoned = true;
      opponent.poisoner = fighterIndex;
    }

    // Remove weapon if thrown
    if (attackType === StepType.Throw && fighter.activeWeapon) {
      fighter.activeWeapon = null;
    }

    // Counter attack
    if (opponent.skills.includes('counterAttack') && Math.random() < 0.3) {
      const counterDamage = Math.floor(actualDamage * 0.5);
      applyDamage(fighter, counterDamage, steps, 1 - fighterIndex, StepType.Counter);
      steps.push({
        type: StepType.Counter,
        fighter: 1 - fighterIndex,
        target: fighterIndex,
        damage: counterDamage,
        targetHP: Math.max(0, fighter.hp),
      });
    }
  } else if (hitResult.evaded) {
    steps.push({
      type: StepType.Evade,
      fighter: 1 - fighterIndex,
    });
  } else if (hitResult.blocked) {
    steps.push({
      type: StepType.Block,
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
    type: StepType.MoveBack,
    fighter: fighterIndex,
  });

  if (usedSkill) {
    expireSkill(fighter, usedSkill, steps);
  }

  return steps;
}

// Helper functions
function activateSkill(fighter, skill, steps) {
  steps.push({ type: StepType.SkillActivate, fighter: fighter.index, skill });
  fighter.activeSkills.push(skill);
}

function expireSkill(fighter, skill, steps) {
  steps.push({ type: StepType.SkillExpire, fighter: fighter.index, skill });
  fighter.activeSkills = fighter.activeSkills.filter((s) => s !== skill);
}

function healFighter(fighter, amount, steps, stepType) {
  const heal = Math.min(amount, fighter.maxHp - fighter.hp);
  if (heal <= 0) return;
  fighter.hp += heal;
  steps.push({ type: stepType, fighter: fighter.index, heal, targetHP: fighter.hp });
}

function dropShield(target, steps) {
  if (!target.shield) return;
  target.shield = false;
  steps.push({ type: StepType.DropShield, fighter: target.index });
}

function applyDamage(target, damage, steps, attackerIndex, stepType) {
  let actual = damage;
  if (target.resistant) {
    const cap = Math.floor(target.maxHp * 0.2);
    if (actual > cap) {
      actual = cap;
      steps.push({ type: StepType.Resist, fighter: target.index });
    }
  }
  target.hp -= actual;

  if (target.shield && (stepType === StepType.Hammer || stepType === StepType.FlashFlood)) {
    dropShield(target, steps);
  }

  if (target.survival && target.hp <= 0) {
    target.survival = false;
    target.hp = 1;
    steps.push({ type: StepType.Survive, fighter: target.index });
  }

  if (target.hp < 0) target.hp = 0;

  return actual;
}

function applyPoisonTick(fighter, steps) {
  if (fighter.poisonCounter > 0 && fighter.hp > 0) {
    const dmg = fighter.poisonDamage || Math.max(1, Math.floor(fighter.maxHp / 20));
    fighter.poisonCounter--;
    if (fighter.poisonCounter <= 0) {
      fighter.poisoned = false;
      fighter.poisoner = null;
    }
    const actual = applyDamage(fighter, dmg, steps, fighter.poisoner, StepType.Poison);
    steps.push({
      type: StepType.Poison,
      fighter: fighter.poisoner,
      target: fighter.index,
      damage: actual,
      targetHP: Math.max(0, fighter.hp),
    });
  }
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