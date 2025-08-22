// Formula adapter module
// Purpose: centralize combat formulas so we can later map to official LaBrute mechanics
// Current implementation mirrors existing in-engine behavior for parity.

import { weaponStats, getWeaponDamageModifier } from '../game/weapons.js';
import { SkillModifiers, FightStat } from '../game/skills.js';
import { LABRUTE_WEAPONS } from './labrute-complete.js';

// Utility: clamp value to [0, 0.99]
function clamp01(v) {
  if (Number.isNaN(v)) return 0;
  return Math.max(0, Math.min(0.99, v));
}

// Aggregate skill effects relevant to formulas
function aggregateFromSkills(skills) {
  const res = {
    strength: { percent: 0, flat: 0 },
    agility: { percent: 0, flat: 0 },
    speed: { percent: 0, flat: 0 },
    accuracy: 0, // additive to hit chance
    evasion: 0,  // additive to dodge chance
    block: 0,    // additive to block chance
    counter: 0,  // additive to counter chance
    combo: 0,    // additive combo points
    initiative: 0, // flat bonus reducing final initiative score (earlier)
  };
  if (!Array.isArray(skills) || skills.length === 0) return res;
  for (const s of skills) {
    const m = SkillModifiers[s];
    if (!m) continue;
    if (m[FightStat.STRENGTH]) {
      res.strength.percent += m[FightStat.STRENGTH].percent || 0;
      res.strength.flat += m[FightStat.STRENGTH].flat || 0;
    }
    if (m[FightStat.AGILITY]) {
      res.agility.percent += m[FightStat.AGILITY].percent || 0;
      res.agility.flat += m[FightStat.AGILITY].flat || 0;
    }
    if (m[FightStat.SPEED]) {
      res.speed.percent += m[FightStat.SPEED].percent || 0;
      res.speed.flat += m[FightStat.SPEED].flat || 0;
    }
    if (m[FightStat.ACCURACY]) res.accuracy += m[FightStat.ACCURACY].percent || 0;
    if (m[FightStat.EVASION]) res.evasion += m[FightStat.EVASION].percent || 0;
    if (m[FightStat.BLOCK]) res.block += m[FightStat.BLOCK].percent || 0;
    if (m[FightStat.COUNTER]) res.counter += m[FightStat.COUNTER].percent || 0;
    if (m[FightStat.COMBO]) res.combo += m[FightStat.COMBO].percent || 0;
    if (m[FightStat.INITIATIVE]) res.initiative += m[FightStat.INITIATIVE].flat || 0;
  }
  return res;
}

// Compute adjusted base stats (STR/AGI/SPD) with skill effects
function getAdjustedStats(stats) {
  const agg = aggregateFromSkills(stats && stats.skills);
  const speedBase = (stats.speed ?? 10);
  return {
    ...stats,
    strength: (stats.strength ?? 0) * (1 + agg.strength.percent) + agg.strength.flat,
    agility: (stats.agility ?? 0) * (1 + agg.agility.percent) + agg.agility.flat,
    speed: speedBase * (1 + agg.speed.percent) + agg.speed.flat,
  };
}

/**
 * Compute initiative value for a fighter.
 * Lower is earlier.
 * Mirrors existing engine: baseInitiative - speed*0.01 + rand(0..0.1)
 */
export function computeInitiative(stats, rng) {
  const jitter = rng.float() * 0.1; // [0, 0.1)
  const agg = aggregateFromSkills(stats && stats.skills);
  const adjustedSpeed = getAdjustedStats(stats).speed;
  // Lower is earlier. Positive initiative bonuses reduce final value.
  return stats.baseInitiative - (adjustedSpeed * 0.01) + jitter - (agg.initiative || 0);
}

/**
 * Counter chance: base 1% per counter point
 */
export function computeCounterChance(stats) {
  const agg = aggregateFromSkills(stats && stats.skills);
  const base = (stats.counter || 0) * 0.01;
  return clamp01(base + (agg.counter || 0));
}

/**
 * Counter damage: 50% of defender strength with ±20% variation (0.8..1.2)
 */
export function computeCounterDamage(stats, rng) {
  const adjusted = getAdjustedStats(stats);
  return Math.floor(adjusted.strength * 0.5 * (0.8 + rng.float() * 0.4));
}

/**
 * Block chance: base 1% per defense point
 */
export function computeBlockChance(stats) {
  const agg = aggregateFromSkills(stats && stats.skills);
  const base = (stats.defense || 0) * 0.01;
  const extra = (stats.blockChance || 0) + (agg.block || 0);
  return clamp01(base + extra);
}

/**
 * Block damage calculation: compute potential and apply reduction, return final damage taken
 * potential = STR * (0.75..1.25)
 * final = potential - floor(potential * reduction)
 */
export function computeBlockDamage(attackerStats, rng, damageReduction = 0.75) {
  const adjusted = getAdjustedStats(attackerStats);
  const potentialDamage = Math.floor(adjusted.strength * (0.75 + (rng.float() * 0.5)));
  const blockedDamage = Math.floor(potentialDamage * damageReduction);
  return potentialDamage - blockedDamage;
}

/**
 * Dodge chance: agility provides 0.8% per point
 */
export function computeDodgeChance(stats) {
  const agg = aggregateFromSkills(stats && stats.skills);
  const adjusted = getAdjustedStats(stats);
  const base = (adjusted.agility || 0) * 0.008;
  const extra = (stats.evasionBonus || 0) + (agg.evasion || 0);
  return clamp01(base + extra);
}

/**
 * Accuracy base and weapon modifiers
 */
export function computeAccuracy(attackerStats, weaponType) {
  // Try LaBrute weapons first
  const labruteWeapon = LABRUTE_WEAPONS[weaponType];
  let weaponAcc = 0.75; // Default accuracy
  
  if (labruteWeapon) {
    // LaBrute weapons have different accuracy system, many have 0
    // Convert to reasonable accuracy values
    if (labruteWeapon.accuracy !== undefined && labruteWeapon.accuracy > 0) {
      weaponAcc = labruteWeapon.accuracy / 100; // Convert to percentage
    } else {
      // Default accuracy for LaBrute weapons without specific accuracy
      weaponAcc = 0.85; // Good default hit chance
    }
  } else if (weaponType && weaponStats[weaponType] && typeof weaponStats[weaponType].accuracy === 'number') {
    weaponAcc = weaponStats[weaponType].accuracy;
  }
  
  const agg = aggregateFromSkills(attackerStats && attackerStats.skills);
  const bonus = (attackerStats.accuracyBonus || 0) + (agg.accuracy || 0);
  return clamp01(weaponAcc + bonus);
}

/**
 * Base damage from strength + weapon modifier (or fists boost)
 * Using official LaBrute weapon damage values
 * FORMULE OFFICIELLE LABRUTE:
 * - Avec arme: damage = (weapon_damage / 10) + strength
 * - Sans arme: damage = strength
 */
export function computeBaseDamage(attackerStats, hasWeapon, weaponType) {
  const adjusted = getAdjustedStats(attackerStats);
  let baseDamage = adjusted.strength;
  
  if (hasWeapon && weaponType) {
    // Try to get LaBrute weapon stats first
    const labruteWeapon = LABRUTE_WEAPONS[weaponType];
    if (labruteWeapon && labruteWeapon.damage) {
      // FORMULE OFFICIELLE LABRUTE: weapon_damage/10 + strength
      // Les dégâts dans labrute-complete.js sont les valeurs brutes
      baseDamage = (labruteWeapon.damage / 10) + adjusted.strength;
    } else {
      // Fallback to old system for custom weapons
      baseDamage *= getWeaponDamageModifier(weaponType, attackerStats);
    }
  } else {
    // FORMULE OFFICIELLE: Poings nus = strength seulement
    baseDamage = adjusted.strength;
  }
  
  return Math.floor(baseDamage);
}

/**
 * Damage variation multiplier: ±25% (0.75..1.25)
 */
export function computeDamageVariation(rng) {
  return 0.75 + (rng.float() * 0.5);
}

/**
 * Critical chance: base 10%, overridable by weapon stats
 */
export function computeCritChance(weaponType) {
  let criticalChance = 0.10;
  if (weaponType && weaponStats[weaponType]) {
    criticalChance = weaponStats[weaponType].critChance || 0.10;
  }
  return criticalChance;
}

/**
 * Combo chance and length helpers
 */
export function computeComboChance(attackerStats) {
  const agg = aggregateFromSkills(attackerStats && attackerStats.skills);
  const comboPoints = (attackerStats.combo || 0) + (attackerStats.comboBonus || 0) + (agg.combo || 0);
  return clamp01(comboPoints * 0.15); // 15% per combo point
}

export function computeMaxCombo(attackerStats) {
  const agg = aggregateFromSkills(attackerStats && attackerStats.skills);
  const comboPoints = (attackerStats.combo || 0) + (attackerStats.comboBonus || 0) + (agg.combo || 0);
  return Math.min(5, 3 + Math.floor((comboPoints || 0) / 2));
}

export default {
  computeInitiative,
  computeCounterChance,
  computeCounterDamage,
  computeBlockChance,
  computeBlockDamage,
  computeDodgeChance,
  computeAccuracy,
  computeBaseDamage,
  computeDamageVariation,
  computeCritChance,
  computeComboChance,
  computeMaxCombo,
};
