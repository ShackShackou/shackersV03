import test from 'node:test';
import assert from 'node:assert/strict';
import EngineModule from './LaBruteEngine.js';
import constants from '../engine/labrute-core/constants.js';
const { LaBruteEngine } = EngineModule;
const { StepType } = constants;

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
