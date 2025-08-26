import test from 'node:test';
import assert from 'node:assert/strict';
import EngineModule from './LaBruteEngine.js';
import constants from '../engine/labrute-core/constants.js';
const { LaBruteEngine } = EngineModule;
const { StepType } = constants;
import { LaBruteAuthenticEngine } from '../../src/engine/LaBruteAuthenticEngine.js';
import { SkillName } from '../../src/config/enums.js';

function baseBrute(overrides = {}) {
  return {
    id: overrides.id || 'a',
    name: overrides.name || 'Brute',
    level: overrides.level || 1,
    strength: overrides.strength || 10,
    agility: overrides.agility || 10,
    speed: overrides.speed || 10,
    hp: overrides.hp || 100,
    skills: overrides.skills || [],
    weapons: overrides.weapons || [],
    body: '0000000000',
    colors: '00000000',
    gender: 'male',
    rank: 1,
  };
}

test('generates move and move back steps', () => {
  const engine = new LaBruteEngine();
  const res = engine.generateFight(baseBrute(), baseBrute({ id: 'b', name: 'B' }));
  assert(res.steps.some(s => s.a === StepType.Move));
  assert(res.steps.some(s => s.a === StepType.MoveBack));
});

test('generates throw step for throwable weapon', () => {
  const engine = new LaBruteEngine();
  const bruteA = baseBrute({ weapons: ['sai'] });
  const bruteB = baseBrute({ id: 'b', name: 'B' });
  const res = engine.generateFight(bruteA, bruteB);
  assert(res.steps.some(s => s.a === StepType.Throw));
});

test('generates flash flood step with skill', () => {
  const engine = new LaBruteEngine();
  const bruteA = baseBrute({ skills: ['flashFlood'], weapons: ['sword'] });
  const bruteB = baseBrute({ id: 'b', name: 'B' });
  const res = engine.generateFight(bruteA, bruteB);
  assert(res.steps.some(s => s.a === StepType.FlashFlood));
});

test('generates hammer step with skill', () => {
  const engine = new LaBruteEngine();
  const bruteA = baseBrute({ skills: ['hammer'] });
  const bruteB = baseBrute({ id: 'b', name: 'B' });
  const res = engine.generateFight(bruteA, bruteB);
  assert(res.steps.some(s => s.a === StepType.Hammer));
});

test('generates bomb step with skill', () => {
  const engine = new LaBruteEngine();
  const bruteA = baseBrute({ skills: ['bomb'] });
  const bruteB = baseBrute({ id: 'b', name: 'B' });
  const res = engine.generateFight(bruteA, bruteB);
  assert(res.steps.some(s => s.a === StepType.Bomb));
});

test('generates trap step with skill', () => {
  const engine = new LaBruteEngine();
  const bruteA = baseBrute({ skills: ['net'] });
  const bruteB = baseBrute({ id: 'b', name: 'B' });
  const res = engine.generateFight(bruteA, bruteB);
  assert(res.steps.some(s => s.a === StepType.Trap));
});

test('getDamage applies piledriver multiplier', () => {
  const engine = new LaBruteAuthenticEngine();
  const rolls = [0, 1];
  engine.random = { next: () => rolls.shift() };
  const attacker = engine.createDetailedFighter({ strength: 10, agility: 10 }, 0, 'L');
  const defender = engine.createDetailedFighter({ strength: 10, agility: 10 }, 1, 'R');
  attacker.activeSkills = [{ name: SkillName.hammer }];
  const { damage } = engine.getDamage(attacker, defender);
  assert.equal(damage, 51);
});

test('getDamage reduced by leadSkeleton', () => {
  const engine = new LaBruteAuthenticEngine();
  const makeRandom = () => { const rolls = [0, 1]; return { next: () => rolls.shift() }; };
  const attacker = engine.createDetailedFighter({ strength: 10, agility: 10 }, 0, 'L');
  attacker.activeWeapon = { name: 'sword', damage: 5, types: ['melee'] };

  engine.random = makeRandom();
  const defenderNoSkill = engine.createDetailedFighter({ strength: 10, agility: 10 }, 1, 'R');
  const { damage: normal } = engine.getDamage(attacker, defenderNoSkill);

  engine.random = makeRandom();
  const defenderLead = engine.createDetailedFighter({ strength: 10, agility: 10, skills: [SkillName.leadSkeleton] }, 1, 'R');
  const { damage: reduced } = engine.getDamage(attacker, defenderLead);

  assert.equal(normal, 7);
  assert.equal(reduced, 3);
});
