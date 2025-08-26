const test = require('node:test');
const assert = require('node:assert');
const { generateFight, BOSS_GOLD_REWARD, BOSS_XP_REWARD } = require('./generateFight');

test('achievements store tracks wins and losses', () => {
  const team1 = { brutes: [{ id: 'a', name: 'A', strength: 100, hp: 100 }] };
  const team2 = { brutes: [{ id: 'b', name: 'B', strength: 1, hp: 10 }] };
  const result = generateFight({ team1, team2, achievements: true });
  assert.strictEqual(result.winner, 'A');
  assert.strictEqual(result.achievements.a.achievements.wins, 1);
  assert.strictEqual(result.achievements.b.achievements.losses, 1);
});

test('selects backups when available', () => {
  const team1 = {
    brutes: [{ id: 'a', name: 'A', strength: 100, hp: 100 }],
    backups: [{ id: 'a2', name: 'A2' }, { id: 'a3', name: 'A3' }],
  };
  const team2 = { brutes: [{ id: 'b', name: 'B', strength: 1, hp: 10 }] };
  const result = generateFight({ team1, team2, backups: true });
  assert.ok(result.backups.team1.length === 1);
  assert.ok(['a2', 'a3'].includes(result.backups.team1[0]));
});

test('handles boss fights and rewards gold', () => {
  const originalRandom = Math.random;
  const seq = [0.1, 0.2, 0.3, 0.4, 0.5];
  let i = 0;
  Math.random = () => { const r = seq[i % seq.length]; i += 1; return r; };
  const team1 = { brutes: [{ id: 'a', name: 'A', strength: 1000000, hp: 1000000 }] };
  const team2 = { bosses: true };
  try {
    const result = generateFight({ team1, team2 });
    assert.strictEqual(result.boss.defeated, true);
    assert.strictEqual(result.boss.gold, BOSS_GOLD_REWARD);
    assert.strictEqual(result.boss.xp, BOSS_XP_REWARD);
  } finally {
    Math.random = originalRandom;
  }
});

test('applies clan war rewards and modifiers', () => {
  const originalRandom = Math.random;
  const seq = [0.1, 0.2, 0.3, 0.4, 0.5];
  let i = 0;
  Math.random = () => { const r = seq[i % seq.length]; i += 1; return r; };
  const team1 = { brutes: [{ id: 'a', name: 'A', strength: 100, hp: 100 }] };
  const team2 = { brutes: [{ id: 'b', name: 'B', strength: 1, hp: 10 }] };
  try {
    const result = generateFight({ team1, team2, modifiers: ['clan'], clanWar: true });
    assert.strictEqual(result.rewards.xp, 100);
    assert.ok(result.modifiers.includes('clan'));
  } finally {
    Math.random = originalRandom;
  }
});
