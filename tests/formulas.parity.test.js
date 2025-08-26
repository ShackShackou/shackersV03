import assert from 'node:assert';
import { createRequire } from 'module';
import { RNG } from '../src/engine/rng.js';
import { getFighterStat, getDamage } from '../src/engine/formulas.js';
import { weaponStats, WeaponName } from '../src/game/weapons.js';

const require = createRequire(import.meta.url);
const { getDamage: officialGetDamage } = require('../server/engine/labrute-official/getDamage.js');
const { getFighterStat: officialGetFighterStat } = require('../server/engine/labrute-official/getFighterStat.js');

function buildFighter(opts = {}) {
  const weaponType = opts.weapon || WeaponName.sword;
  const ws = weaponStats[weaponType];
  const weapon = {
    name: weaponType,
    damage: ws.damage,
    criticalChance: ws.critChance,
    criticalDamage: 1.5,
    types: [ws.type],
  };
  return {
    type: 'brute',
    strength: opts.strength ?? 20,
    agility: opts.agility ?? 10,
    armor: opts.armor ?? 0,
    baseDamage: 5,
    criticalChance: 0.1,
    criticalDamage: 1.5,
    activeWeapon: weapon,
    skills: opts.skills || [],
    activeSkills: opts.activeSkills || [],
    damagedWeapons: opts.damaged ? [weaponType] : [],
  };
}

// Normal attack parity test
{
  const fighter = buildFighter({ skills: [{ name: 'herculeanStrength' }] });
  const opponent = buildFighter({ weapon: WeaponName.axe, skills: [{ name: 'armor' }], strength: 18, agility: 8, armor: 0.2 });
  const seed = 'parity-1';

  const rng1 = new RNG(seed);
  const originalRandom = Math.random;
  Math.random = () => rng1.float();
  const expected = officialGetDamage(JSON.parse(JSON.stringify(fighter)), JSON.parse(JSON.stringify(opponent)));
  Math.random = originalRandom;

  const rng2 = new RNG(seed);
  const actual = getDamage(JSON.parse(JSON.stringify(fighter)), JSON.parse(JSON.stringify(opponent)), rng2);
  assert.deepStrictEqual(actual, expected);

  const expectedCrit = officialGetFighterStat(fighter, 'CRITICAL_CHANCE');
  const actualCrit = getFighterStat(fighter, 'criticalChance');
  assert.strictEqual(actualCrit, expectedCrit);
}

// Piledriver + fierceBrute + damaged weapon parity test
{
  const fighter = buildFighter({
    skills: [{ name: 'herculeanStrength' }],
    activeSkills: [{ name: 'hammer' }, { name: 'fierceBrute' }],
    damaged: true,
    strength: 25,
    agility: 12,
  });
  const opponent = buildFighter({ weapon: WeaponName.axe, skills: [{ name: 'armor' }], strength: 22, agility: 9, armor: 0.15 });
  const seed = 'parity-2';

  const rng1 = new RNG(seed);
  const originalRandom = Math.random;
  Math.random = () => rng1.float();
  const expected = officialGetDamage(JSON.parse(JSON.stringify(fighter)), JSON.parse(JSON.stringify(opponent)));
  Math.random = originalRandom;

  const rng2 = new RNG(seed);
  const actual = getDamage(JSON.parse(JSON.stringify(fighter)), JSON.parse(JSON.stringify(opponent)), rng2);
  assert.deepStrictEqual(actual, expected);
}

console.log('formulas parity tests passed');
