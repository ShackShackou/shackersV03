import test from 'node:test';
import assert from 'node:assert/strict';
import { computeAccuracy } from './formulas.js';
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
