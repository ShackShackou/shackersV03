import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeAccuracy,
  computeCounterChance,
  computeBlockChance,
  computeDodgeChance,
  computeCritChance,
  computeBaseDamage,
  computeDamageVariation,
  computeThrowDamage,
} from './formulas.js';
import { LABRUTE_WEAPONS } from './labrute-complete.js';

function officialAccuracy(weapon) {
  const base = 0.90;
  const bonus = (LABRUTE_WEAPONS[weapon]?.accuracy || 0) * 0.01;
  return Math.min(0.98, base + bonus);
}

test('knife uses only base accuracy (90%)', () => {
  const res = computeAccuracy({}, 'knife');
  assert.equal(res, officialAccuracy('knife'));
});

test('sai adds weapon accuracy bonus and caps at 98%', () => {
  const res = computeAccuracy({}, 'sai');
  assert.equal(res, officialAccuracy('sai'));
});

const rng = { float: () => 0.5 };
const clamp01 = (v) => Math.max(0, Math.min(0.99, v));

test('counter chance parity with @labrute/core', () => {
  const attacker = { reach: 0 };
  const defender = { counter: 0.1, reach: 0 };
  const expected = clamp01((defender.counter * 10 + (defender.reach - attacker.reach)) * 0.1);
  assert.equal(computeCounterChance(attacker, defender), expected);
});

test('block chance parity with @labrute/core', () => {
  const attacker = { accuracy: 0.2 };
  const defender = { block: 0.5 };
  const expected = clamp01(Math.min(defender.block - attacker.accuracy, 0.9));
  assert.equal(computeBlockChance(attacker, defender), expected);
});

test('dodge chance parity with @labrute/core', () => {
  const attacker = { accuracy: 0.1, dexterity: 0, agility: 10 };
  const defender = { evasion: 0.3, agility: 20 };
  const agilityDiff = Math.min(Math.max(-40, (defender.agility - attacker.agility) * 2), 40);
  const expected = clamp01(
    Math.min(defender.evasion + agilityDiff * 0.01 - attacker.accuracy - attacker.dexterity, 0.9),
  );
  assert.equal(computeDodgeChance(attacker, defender), expected);
});

test('critical chance parity with @labrute/core', () => {
  const fighter = { criticalChance: 0.25 };
  assert.equal(computeCritChance(fighter), 0.25);
});

test('damage parity bare hands and weapon', () => {
  const attacker = { strength: 10 };
  const baseWeapon = computeBaseDamage(attacker, true, 'dagger');
  const baseHands = computeBaseDamage(attacker, false);
  const variation = computeDamageVariation(rng);
  const finalWeapon = Math.floor(baseWeapon * variation);
  const finalHands = Math.floor(baseHands * variation);
  const expectedWeapon = Math.floor((12 + 10 * (0.2 + 12 * 0.05)) * variation);
  const expectedHands = Math.floor((5 + 10 * (0.2 + 5 * 0.05)) * variation);
  assert.equal(finalWeapon, expectedWeapon);
  assert.equal(finalHands, expectedHands);
});

test('thrown weapon damage parity', () => {
  const attacker = { strength: 10, agility: 5 };
  const dmg = computeThrowDamage(attacker, 'dagger', rng);
  const expected = Math.floor((12 + 10 * 0.1 + 5 * 0.15) * (1 + 0.5 * 0.5));
  assert.equal(dmg, expected);
});
