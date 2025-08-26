// Formula adapter module
// Purpose: centralize combat formulas so we can later map to official LaBrute mechanics
// Current implementation mirrors existing in-engine behavior for parity.

import { weaponStats, getWeaponDamageModifier, WeaponName, WeaponType } from '../game/weapons.js';
import { SkillModifiers, FightStat, SkillName } from '../game/skills.js';
import { LABRUTE_WEAPONS } from './labrute-complete.js';

// Base stats when no weapon is equipped
const BASE_FIGHTER_STATS = {
  accuracy: 0,
  block: 0,
  combo: 0,
  counter: 0,
  criticalChance: 0.1,
  criticalDamage: 1.5,
  deflect: 0,
  disarm: 0.05,
  evasion: 0,
  reversal: 0,
  tempo: 1.2,
  dexterity: 0.2,
};

// Skill damage modifiers adapted from official LaBrute formulas
const SkillDamageModifiers = [
  { skill: SkillName.herculeanStrength, percent: 0.5, opponent: false },
  { skill: SkillName.weaponMaster, percent: 0.5, opponent: false, weaponType: WeaponType.SHARP },
  { skill: SkillName.martialArts, percent: 1.0, opponent: false, weaponType: null },
  { skill: SkillName.fierceBrute, percent: 0, opponent: false },
  { skill: SkillName.hammer, percent: 0, opponent: false },
  { skill: SkillName.armor, percent: -0.25, opponent: true },
  { skill: SkillName.toughenedSkin, percent: -0.1, opponent: true },
  { skill: SkillName.leadSkeleton, percent: -0.5, opponent: true },
  { skill: SkillName.resistant, percent: -0.15, opponent: true },
  { skill: SkillName.saboteur, percent: 0.3, opponent: false, weaponType: WeaponType.THROWN },
  { skill: SkillName.bodybuilder, percent: 0.4, opponent: false, weaponType: WeaponType.HEAVY },
  { skill: SkillName.relentless, percent: 0.35, opponent: false, weaponType: WeaponType.FAST },
];

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
    criticalChance: 0, // additive to critical chance
    criticalDamage: 0, // additive to critical damage
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
    if (m.criticalChance) res.criticalChance += m.criticalChance.percent || 0;
    if (m.criticalDamage) res.criticalDamage += m.criticalDamage.percent || 0;
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
  
  // VRAIE FORMULE OFFICIELLE LABRUTE (vérifiée dans getDamage.ts)
  // damage = (base + strength * (0.2 + base * 0.05)) * variation * skillMultiplier
  
  let base = 5; // Dégâts de base mains nues
  
  if (hasWeapon && weaponType) {
    const labruteWeapon = LABRUTE_WEAPONS[weaponType];
    if (labruteWeapon && labruteWeapon.damage) {
      // NE PAS diviser par 10 ! Les valeurs sont déjà correctes
      base = labruteWeapon.damage;
    }
  }
  
  // FORMULE OFFICIELLE: base + strength * (0.2 + base * 0.05)
  // Cette partie calcule les dégâts de base AVANT variation et skills
  const baseDamage = base + adjusted.strength * (0.2 + base * 0.05);
  
  return Math.floor(baseDamage);
}

/**
 * FORMULE OFFICIELLE de variation: 0.8 + Math.random() * 0.4
 * Donne une variation entre 0.8 et 1.2 (±20%)
 */
export function computeDamageVariation(rng) {
  return 0.8 + (rng.float() * 0.4);
}

// === Official LaBrute helpers ===
// Get a fighter stat with weapon and base modifiers
export function getFighterStat(fighter, stat, onlyStat) {
  if (stat === 'dexterity') {
    if (onlyStat === 'fighter') return 0;
    if (fighter.activeWeapon) {
      const weaponStat = fighter.activeWeapon[stat];
      if (fighter.bodybuilder && fighter.activeWeapon.types?.includes(WeaponType.HEAVY)) {
        return weaponStat + (SkillModifiers[SkillName.bodybuilder]?.[FightStat.DEXTERITY]?.percent ?? 0);
      }
      return weaponStat ?? 0;
    }
    return fighter.type === 'brute' ? BASE_FIGHTER_STATS[stat] : 0;
  }

  if (stat === 'tempo') {
    if (fighter.activeWeapon) {
      return fighter.activeWeapon[stat];
    }
    return BASE_FIGHTER_STATS[stat];
  }

  let total = onlyStat === 'weapon' ? 0 : (fighter[stat] ?? 0);

  if (onlyStat !== 'fighter') {
    if (fighter.activeWeapon) {
      total += fighter.activeWeapon[stat] ?? 0;
    } else if (stat !== 'criticalDamage' && stat !== 'criticalChance') {
      total += fighter.type === 'brute' ? BASE_FIGHTER_STATS[stat] ?? 0 : fighter.type === 'boss' ? fighter[stat] ?? 0 : 0;
    }
  }

  return total;
}

// Compute damage using official LaBrute formulas
export function getDamage(fighter, opponent, rng, thrown) {
  const base = thrown ? thrown.damage : (fighter.activeWeapon?.damage || fighter.baseDamage);
  let skillsMultiplier = 1;

  const piledriver = fighter.activeSkills?.find(sk => (sk.name || sk) === SkillName.hammer);

  for (const modifier of SkillDamageModifiers) {
    const hasSkill = fighter.skills?.some(sk => (typeof sk === 'string' ? sk : sk.name) === modifier.skill);
    if (!hasSkill) continue;
    if (modifier.opponent) continue;
    if (thrown && (modifier.skill === SkillName.weaponsMaster || modifier.skill === SkillName.martialArts)) continue;
    if (piledriver && modifier.skill === SkillName.martialArts) continue;

    if (typeof modifier.weaponType !== 'undefined') {
      if (modifier.weaponType === null) {
        if (!fighter.activeWeapon || fighter.activeWeapon.name === WeaponName.mug) {
          skillsMultiplier += modifier.percent ?? 0;
        }
      } else if (fighter.activeWeapon?.types?.includes(modifier.weaponType)) {
        skillsMultiplier += modifier.percent ?? 0;
      }
    } else {
      skillsMultiplier *= 1 + (modifier.percent ?? 0);
    }
  }

  for (const modifier of SkillDamageModifiers) {
    const hasSkill = opponent.skills?.some(sk => (typeof sk === 'string' ? sk : sk.name) === modifier.skill);
    if (!hasSkill) continue;
    if (!modifier.opponent) continue;
    if (thrown && modifier.skill === SkillName.leadSkeleton) continue;

    if (typeof modifier.weaponType !== 'undefined') {
      if (modifier.weaponType === null) {
        if (!fighter.activeWeapon || fighter.activeWeapon.name === WeaponName.mug) {
          skillsMultiplier += modifier.percent ?? 0;
        }
      } else if (fighter.activeWeapon?.types?.includes(modifier.weaponType)) {
        skillsMultiplier += modifier.percent ?? 0;
      }
    } else {
      skillsMultiplier *= 1 + (modifier.percent ?? 0);
    }
  }

  if (fighter.activeSkills?.find(sk => (sk.name || sk) === SkillName.fierceBrute)) {
    skillsMultiplier *= 2;
  }

  if (piledriver) {
    skillsMultiplier *= 4;
  }

  let damage;
  if (thrown) {
    damage = Math.floor((base + fighter.strength * 0.1 + fighter.agility * 0.15) * (1 + rng.float() * 0.5) * skillsMultiplier);
  } else if (piledriver) {
    damage = Math.floor((10 + opponent.strength * 0.6) * (0.8 + rng.float() * 0.4) * skillsMultiplier);
  } else {
    damage = Math.floor((base + fighter.strength * (0.2 + base * 0.05)) * (0.8 + rng.float() * 0.4) * skillsMultiplier);
  }

  if (fighter.activeWeapon && fighter.damagedWeapons?.includes(fighter.activeWeapon.name)) {
    damage = Math.floor(damage * 0.75);
  }

  const criticalChance = getFighterStat(fighter, 'criticalChance');
  const criticalHit = !!criticalChance && rng.float() < criticalChance;
  if (criticalHit) {
    damage = Math.floor(damage * getFighterStat(fighter, 'criticalDamage'));
  }

  if (!thrown) {
    damage = Math.ceil(damage * (1 - opponent.armor));
  }

  if (damage < 1) {
    damage = 1;
  }

  return { damage, criticalHit };
}

/**
 * Critical chance using cumulative stats (base + skills + weapon)
 */
export function computeCritChance(stats, hasWeapon, weaponType) {
  const agg = aggregateFromSkills(stats && stats.skills);
  let chance = (stats.criticalChance ?? BASE_FIGHTER_STATS.criticalChance) + (agg.criticalChance || 0);
  if (hasWeapon && weaponType) {
    if (weaponStats[weaponType]) {
      chance += weaponStats[weaponType].critChance || 0;
    } else if (LABRUTE_WEAPONS[weaponType]) {
      chance += (LABRUTE_WEAPONS[weaponType].criticalChance || 0) / 100;
    }
  }
  return clamp01(chance);
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
  getFighterStat,
  getDamage,
  computeComboChance,
  computeMaxCombo,
};
