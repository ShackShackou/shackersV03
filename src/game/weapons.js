import { LABRUTE_WEAPONS } from './labrute-weapons.js';

// Weapon names derived from official dataset
export const WeaponName = Object.freeze(
  Object.keys(LABRUTE_WEAPONS).reduce((acc, name) => {
    acc[name] = name;
    return acc;
  }, {})
);

// Weapon types used in the game
export const WeaponType = {
  FAST: 'fast',
  SHARP: 'sharp',
  HEAVY: 'heavy',
  LONG: 'long',
  THROWN: 'thrown',
  BLUNT: 'blunt',
};

// Normalize official data to maintain previous access pattern
export const weaponStats = Object.fromEntries(
  Object.entries(LABRUTE_WEAPONS).map(([name, data]) => [
    name,
    {
      ...data,
      type: Array.isArray(data.types) ? data.types[0] : data.type,
      critChance: data.critChance ?? data.criticalChance ?? 0,
    },
  ])
);

export function getRandomWeapon() {
  const weapons = Object.keys(weaponStats);
  return weapons[Math.floor(Math.random() * weapons.length)];
}

export function getWeaponDamageModifier(weaponType, fighterStats) {
  const weapon = weaponStats[weaponType];
  if (!weapon) return 1;

  let modifier = (weapon.damage ?? 0) / 10; // Base modifier from weapon damage

  const primaryType = weapon.type;

  // Apply skill bonuses
  if (fighterStats.skills) {
    if (fighterStats.skills.includes('weaponMaster')) {
      modifier *= 1.15; // 15% bonus
    }

    // Specific weapon type bonuses
    if (primaryType === WeaponType.SHARP && fighterStats.skills.includes('swordMastery')) {
      modifier *= 1.2;
    }
    if (primaryType === WeaponType.HEAVY && fighterStats.skills.includes('bodybuilder')) {
      modifier *= 1.1;
    }
  }

  return modifier;
}

