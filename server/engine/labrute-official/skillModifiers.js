/**
 * OFFICIAL LABRUTE SKILL DAMAGE MODIFIERS
 * All skill effects on damage calculation
 */

const { SkillName, FightStat } = require('./constants');

const SkillDamageModifiers = [
  // Fighter skills that increase damage
  {
    skill: SkillName.herculeanStrength,
    percent: 0.5, // +50% damage
    opponent: false,
  },
  {
    skill: SkillName.weaponsMaster,
    percent: 0.5, // +50% weapon damage
    opponent: false,
    weaponType: 'any', // All weapons
  },
  {
    skill: SkillName.martialArts,
    percent: 1.0, // +100% bare hands damage
    opponent: false,
    weaponType: null, // Only bare hands
  },
  {
    skill: SkillName.fierceBrute,
    percent: 0, // Special handling in getDamage (x2)
    opponent: false,
  },
  {
    skill: SkillName.hammer,
    percent: 0, // Special handling in getDamage (x4)
    opponent: false,
  },
  
  // Opponent skills that reduce damage
  {
    skill: SkillName.armor,
    percent: -0.25, // -25% damage received
    opponent: true,
  },
  {
    skill: SkillName.toughenedSkin,
    percent: -0.1, // -10% damage received
    opponent: true,
  },
  {
    skill: SkillName.leadSkeleton,
    percent: -0.5, // -50% damage from non-thrown weapons
    opponent: true,
    weaponType: 'melee',
  },
  {
    skill: SkillName.resistant,
    percent: -0.15, // -15% damage received
    opponent: true,
  },
  
  // Weapon-specific modifiers
  {
    skill: SkillName.saboteur,
    percent: 0.3, // +30% damage with thrown weapons
    opponent: false,
    weaponType: 'thrown',
  },
  {
    skill: SkillName.bodybuilder,
    percent: 0.4, // +40% damage with heavy weapons
    opponent: false,
    weaponType: 'heavy',
  },
  {
    skill: SkillName.relentless,
    percent: 0.35, // +35% damage with fast weapons
    opponent: false,
    weaponType: 'fast',
  },
];

// Misc skill stat modifiers needed for hit calculations
// Only the values required by the simplified server engine are listed here
const SkillModifiers = {
  [SkillName.hideaway]: {
    [FightStat.BLOCK]: { percent: 0.25 },
  },
  [SkillName.survival]: {
    [FightStat.BLOCK]: { percent: 0.2 },
    [FightStat.EVASION]: { percent: 0.2 },
  },
};

module.exports = { SkillDamageModifiers, SkillModifiers };