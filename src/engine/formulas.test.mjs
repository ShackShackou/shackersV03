import test from 'node:test';
import assert from 'node:assert/strict';
import { computeAccuracy, computeBlockChance, computeDodgeChance, computeThrowDamage } from './formulas.js';
import { LABRUTE_WEAPONS } from '../game/labrute-weapons.js';

function officialAccuracy(weapon) {
  const base = 0.90;
  const bonus = (LABRUTE_WEAPONS[weapon]?.accuracy || 0) * 0.01;
  return Math.min(0.98, base + bonus);
}

test('knife uses only base accuracy (90%)', () => {
  const res = computeAccuracy({}, {}, 'knife');
  assert.equal(res, officialAccuracy('knife'));
});

test('leek adds weapon accuracy bonus', () => {
  const res = computeAccuracy({}, {}, 'leek');
  assert.equal(res, officialAccuracy('leek'));
});

test('block chance uses defender defense stat', () => {
  const attacker = {};
  const defender = { defense: 50 };
  const res = computeBlockChance(attacker, defender);
  assert.equal(res, 0.5);
});

test('dodge chance uses defender agility', () => {
  const attacker = {};
  const defender = { agility: 50 };
  const res = computeDodgeChance(attacker, defender);
  assert.equal(res, 0.4);
});

test('computeThrowDamage factors attacker stats', () => {
  const attacker = { strength: 10, agility: 20 };
  const rng = { float: () => 0 };
  const res = computeThrowDamage(attacker, {}, rng, 5);
  assert.equal(res, 9);
});
