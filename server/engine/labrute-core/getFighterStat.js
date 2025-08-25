// Converted from TypeScript to JavaScript - LaBrute Official Engine
// Original source: labrute/server/src/utils/fight/getFighterStat.ts

// Base fighter stats when no weapon is equipped
const BASE_FIGHTER_STATS = {
  accuracy: 0,
  block: 0,
  combo: 0,
  counter: 0,
  critical: 0,
  criticalDamage: 1.5,
  deflect: 0,
  disarm: 0,
  evasion: 0,
  reversal: 0,
  tempo: 1.2,
  dexterity: 0
};

// Fight stat constants
const FightStat = {
  ACCURACY: 'accuracy',
  BLOCK: 'block',
  COMBO: 'combo',
  COUNTER: 'counter',
  CRITICAL_CHANCE: 'critical',
  CRITICAL_DAMAGE: 'criticalDamage',
  DEFLECT: 'deflect',
  DISARM: 'disarm',
  EVASION: 'evasion',
  REVERSAL: 'reversal',
  TEMPO: 'tempo',
  DEXTERITY: 'dexterity'
};

// Weapon type constants
const WeaponType = {
  HEAVY: 'heavy'
};

// Skill names
const SkillName = {
  bodybuilder: 'bodybuilder'
};

// Skill modifiers - will be populated from core data
const SkillModifiers = {
  [SkillName.bodybuilder]: {
    [FightStat.DEXTERITY]: { percent: 0.1 }
  }
};

/**
 * Get a specific stat from a fighter, considering weapon bonuses and skills
 * @param {Object} fighter - The fighter object
 * @param {string} stat - The stat to retrieve
 * @param {string} onlyStat - Optional filter: 'fighter' or 'weapon'
 * @returns {number} The calculated stat value
 */
const getFighterStat = (fighter, stat, onlyStat) => {
  // Special case for dexterity as it only exists on weapons
  if (stat === 'dexterity') {
    if (onlyStat === 'fighter') return 0;

    if (fighter.activeWeapon) {
      const weaponStat = fighter.activeWeapon[stat];

      // BODYBUILDER
      if (fighter.bodybuilder && fighter.activeWeapon.types.includes(WeaponType.HEAVY)) {
        return weaponStat
          + (SkillModifiers[SkillName.bodybuilder][FightStat.DEXTERITY]?.percent ?? 0);
      }

      return weaponStat;
    }

    return fighter.type === 'brute' ? BASE_FIGHTER_STATS[stat] : 0;
  }

  // Special case for tempo as it's either weapon or base
  if (stat === 'tempo') {
    if (fighter.activeWeapon) {
      return fighter.activeWeapon[stat];
    }

    return BASE_FIGHTER_STATS[stat];
  }

  let total = onlyStat === 'weapon' ? 0 : fighter[stat];

  if (onlyStat !== 'fighter') {
    if (fighter.activeWeapon) {
      total += fighter.activeWeapon[stat];
    } else if (stat !== FightStat.CRITICAL_DAMAGE && stat !== FightStat.CRITICAL_CHANCE) {
      // Ignore crit stats are they are already handled in getFighters
      total += fighter.type === 'brute'
        ? BASE_FIGHTER_STATS[stat]
        : fighter.type === 'boss'
          ? fighter[stat]
          : 0;
    }
  }

  return total;
};

module.exports = { 
  getFighterStat, 
  BASE_FIGHTER_STATS, 
  FightStat, 
  WeaponType, 
  SkillName, 
  SkillModifiers 
};