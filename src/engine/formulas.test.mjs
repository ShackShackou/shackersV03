import test from 'node:test';
import assert from 'node:assert/strict';
import { computeAccuracy } from './formulas.js';
import { LABRUTE_WEAPONS } from '../game/labrute-weapons.js';

function officialAccuracy(weapon) {
  const base = 0.90;
  const bonus = (LABRUTE_WEAPONS[weapon]?.accuracy || 0) * 0.01;
  return Math.min(0.98, base + bonus);
}

test('knife uses only base accuracy (90%)', () => {
  const res = computeAccuracy({}, 'knife');
  assert.equal(res, officialAccuracy('knife'));
});

test('leek adds weapon accuracy bonus', () => {
  const res = computeAccuracy({}, 'leek');
  assert.equal(res, officialAccuracy('leek'));
});
