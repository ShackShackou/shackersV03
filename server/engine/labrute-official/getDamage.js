/**
 * OFFICIAL LABRUTE DAMAGE CALCULATION
 * Converted from TypeScript - 100% faithful to the original
 * Source: fichiers_labrute-officiel/labrute/server/src/utils/fight/getDamage.ts
 */

const { SkillName, WeaponName } = require('./constants');
const { getFighterStat } = require('./getFighterStat');
const { SkillDamageModifiers } = require('./skillModifiers');

/**
 * Calculate damage dealt by a fighter to an opponent
 * @param {Object} fighter - The attacking fighter
 * @param {Object} opponent - The defending fighter
 * @param {Object} thrown - Optional thrown weapon
 * @returns {Object} {damage: number, criticalHit: boolean}
 */
const getDamage = (fighter, opponent, thrown = null, rng) => {
  // Base damage calculation
  const base = thrown
    ? thrown.damage
    : (fighter.activeWeapon?.damage || fighter.baseDamage);
  
  let skillsMultiplier = 1;

  // Check if Piledriver (hammer skill) is active
  const piledriver = fighter.activeSkills.find((sk) => sk.name === SkillName.hammer);

  // Apply fighter skill damage modifiers
  for (const modifier of SkillDamageModifiers) {
    // Skip if fighter doesn't have the skill
    if (!fighter.skills.find((sk) => sk.name === modifier.skill)) {
      continue;
    }

    // Skip if the modifier is for the opponent
    if (modifier.opponent) {
      continue;
    }

    // Skip weaponsMaster and martialArts if throwing weapon
    if (thrown) {
      if (modifier.skill === SkillName.weaponsMaster || modifier.skill === SkillName.martialArts) {
        continue;
      }
    }

    // Skip martialArts if piledriver is active
    if (piledriver && modifier.skill === SkillName.martialArts) {
      continue;
    }

    // Apply damage modifiers based on weapon type
    if (typeof modifier.weaponType !== 'undefined') {
      // Null weapon type means empty hands or mug
      if (modifier.weaponType === null) {
        if (!fighter.activeWeapon || fighter.activeWeapon.name === WeaponName.mug) {
          skillsMultiplier += modifier.percent ?? 0;
        }
      } else if (fighter.activeWeapon?.types.includes(modifier.weaponType)) {
        // Apply modifier if weapon type matches
        skillsMultiplier += modifier.percent ?? 0;
      }
    } else {
      // Global damage modifier
      skillsMultiplier *= 1 + (modifier.percent ?? 0);
    }
  }

  // Apply opponent skill damage modifiers (damage reduction)
  for (const modifier of SkillDamageModifiers) {
    // Skip if opponent doesn't have the skill
    if (!opponent.skills.find((sk) => sk.name === modifier.skill)) {
      continue;
    }

    // Skip if the modifier is not for the opponent
    if (!modifier.opponent) {
      continue;
    }

    // Skip leadSkeleton if thrown weapon
    if (thrown) {
      if (modifier.skill === SkillName.leadSkeleton) {
        continue;
      }
    }

    // Apply damage modifiers based on weapon type
    if (typeof modifier.weaponType !== 'undefined') {
      if (modifier.weaponType === null) {
        if (!fighter.activeWeapon || fighter.activeWeapon.name === WeaponName.mug) {
          skillsMultiplier += modifier.percent ?? 0;
        }
      } else if (fighter.activeWeapon?.types.includes(modifier.weaponType)) {
        skillsMultiplier += modifier.percent ?? 0;
      }
    } else {
      // Global damage modifier
      skillsMultiplier *= 1 + (modifier.percent ?? 0);
    }
  }

  // x2 damage if fierceBrute skill is active
  if (fighter.activeSkills.find((sk) => sk.name === 'fierceBrute')) {
    skillsMultiplier *= 2;
  }

  // x4 damage for piledriver
  if (piledriver) {
    skillsMultiplier *= 4;
  }

  let damage = 0;

  // Calculate damage based on attack type
  if (thrown) {
    // Thrown weapon damage formula
    damage = Math.floor(
      (base + fighter.strength * 0.1 + fighter.agility * 0.15)
      * (1 + rng.float() * 0.5) * skillsMultiplier
    );
  } else if (piledriver) {
    // Piledriver damage formula (uses opponent's strength against them)
    damage = Math.floor(
      (10 + opponent.strength * 0.6)
      * (0.8 + rng.float() * 0.4) * skillsMultiplier
    );
  } else {
    // Normal attack damage formula
    damage = Math.floor(
      (base + fighter.strength * (0.2 + base * 0.05))
      * (0.8 + rng.float() * 0.4) * skillsMultiplier
    );
  }

  // -25% damage if weapon is damaged
  if (fighter.activeWeapon && fighter.damagedWeapons.includes(fighter.activeWeapon.name)) {
    damage = Math.floor(damage * 0.75);
  }

  // Critical hit calculation
  const criticalChance = getFighterStat(fighter, 'CRITICAL_CHANCE');
  const criticalHit = !!criticalChance && rng.float() < criticalChance;
  if (criticalHit) {
    damage = Math.floor(damage * getFighterStat(fighter, 'CRITICAL_DAMAGE'));
  }

  // Reduce damage with opponent's armor (not for thrown weapons)
  if (!thrown) {
    damage = Math.ceil(damage * (1 - opponent.armor));
  }

  // Minimum damage is always 1
  if (damage < 1) {
    damage = 1;
  }

  return {
    damage,
    criticalHit,
  };
};

module.exports = { getDamage };