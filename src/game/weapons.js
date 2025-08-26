import { LABRUTE_WEAPONS } from './labrute-weapons.js';

// Generate the list of weapon names from official data and keep legacy ones
export const WeaponName = {
  ...Object.fromEntries(Object.keys(LABRUTE_WEAPONS).map((k) => [k, k])),

  // Legacy/custom weapons not present in the official list
  dagger: 'dagger',
  hammer: 'hammer',
  mace: 'mace',
  club: 'club',
  staff: 'staff',
  spear: 'spear',
};

export const WeaponType = {
  FAST: 'fast',
  SHARP: 'sharp',
  HEAVY: 'heavy',
  LONG: 'long',
  THROWN: 'thrown',
  BLUNT: 'blunt',
};

const clamp01 = (v) => Math.max(0, Math.min(0.99, v));

// Legacy weapon stats for non-official weapons
const LEGACY_WEAPON_STATS = {
  [WeaponName.dagger]: { type: WeaponType.FAST, damage: 12, accuracy: 0.88, critChance: 0.2, types: [WeaponType.FAST] },
  [WeaponName.hammer]: { type: WeaponType.HEAVY, damage: 25, accuracy: 0.65, critChance: 0.15, types: [WeaponType.HEAVY] },
  [WeaponName.mace]: { type: WeaponType.HEAVY, damage: 22, accuracy: 0.68, critChance: 0.12, types: [WeaponType.HEAVY] },
  [WeaponName.club]: { type: WeaponType.HEAVY, damage: 20, accuracy: 0.7, critChance: 0.1, types: [WeaponType.HEAVY] },
  [WeaponName.staff]: { type: WeaponType.LONG, damage: 15, accuracy: 0.77, critChance: 0.11, types: [WeaponType.LONG] },
  [WeaponName.spear]: { type: WeaponType.LONG, damage: 16, accuracy: 0.75, critChance: 0.13, types: [WeaponType.LONG] },
};

// Build stats from official data then merge legacy ones
export const weaponStats = {
  ...Object.fromEntries(
    Object.entries(LABRUTE_WEAPONS).map(([name, data]) => {
      const accuracy = clamp01(0.75 + (data.accuracy || 0));
      const crit = clamp01(data.criticalChance ?? 0);
      const types = Array.isArray(data.types) ? data.types : [];
      return [name, {
        type: types[0] || WeaponType.BLUNT,
        types,
        damage: data.damage ?? 0,
        accuracy,
        critChance: crit,
      }];
    })
  ),
  ...LEGACY_WEAPON_STATS,
};

export function getRandomWeapon() {
  const weapons = Object.keys(WeaponName);
  return weapons[Math.floor(Math.random() * weapons.length)];
}

export function getWeaponDamageModifier(weaponType, fighterStats) {
  const weapon = weaponStats[weaponType];
  if (!weapon) return 1;

  let modifier = weapon.damage / 10; // Base modifier from weapon damage

  // Apply skill bonuses
  if (fighterStats.skills) {
    if (fighterStats.skills.includes('weaponMaster')) {
      modifier *= 1.15; // 15% bonus
    }

    // Specific weapon type bonuses
    if (weapon.types && weapon.types.includes(WeaponType.SHARP) && fighterStats.skills.includes('swordMastery')) {
      modifier *= 1.2;
    }
    if (weapon.types && weapon.types.includes(WeaponType.HEAVY) && fighterStats.skills.includes('bodybuilder')) {
      modifier *= 1.1;
    }
  }

  return modifier;
}
