import assert from 'assert';
import { computeCritChance, computeDamage, computeBaseDamage, computeDamageVariation } from '../src/engine/formulas.js';
import { WeaponName, weaponStats } from '../src/game/weapons.js';
import { SkillName } from '../src/game/skills.js';
import { RNG } from '../src/engine/rng.js';

// Test critical chance aggregation
(function testCritChance() {
  const fighter = {
    stats: { skills: [] },
    hasWeapon: true,
    weaponType: WeaponName.knife,
  };
  const critChance = computeCritChance(fighter);
  assert.strictEqual(critChance, weaponStats[WeaponName.knife].critChance);
})();

// Test damage with skill modifiers and seed
(function testDamageWithSkills() {
  const attacker = {
    stats: { strength: 10, skills: [SkillName.herculeanStrength] },
    hasWeapon: true,
    weaponType: WeaponName.knife,
  };
  const defender = {
    stats: { defense: 0, skills: [SkillName.armor] },
    hasWeapon: false,
  };

  const rng1 = new RNG('damage');
  const result = computeDamage(attacker, defender, rng1);

  // Recompute expected manually with same seed
  const rng2 = new RNG('damage');
  const base = computeBaseDamage(attacker.stats, attacker.hasWeapon, attacker.weaponType);
  const variation = computeDamageVariation(rng2);
  const critRoll = rng2.float();
  const skillsMultiplier = (1 + 0.5) * (1 - 0.25);
  let expected = Math.floor(base * variation * skillsMultiplier);
  const critChance = weaponStats[attacker.weaponType].critChance;
  const critical = critRoll < critChance;
  if (critical) {
    expected = Math.floor(expected * 2);
  }
  assert.strictEqual(result.damage, expected);
  assert.strictEqual(result.critical, critical);
})();

console.log('formulas tests passed');
