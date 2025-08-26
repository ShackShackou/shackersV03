const FightManager = require('./FightManager');
const { randomItem } = require('../engine/labrute-core/constants');

// Simple constant for boss gold reward
const BOSS_GOLD_REWARD = 1000;

// Select a single backup from a list
const selectBackup = (backups) => {
  if (!backups || backups.length === 0) {
    return null;
  }
  return randomItem(backups);
};

// Expand bosses according to their count
const expandBosses = (bosses) => {
  const result = [];
  (bosses || []).forEach((boss) => {
    const count = boss.count || 1;
    for (let i = 0; i < count; i += 1) {
      result.push({ ...boss });
    }
  });
  return result;
};

/**
 * Generate a fight with optional achievements, backups and bosses logic.
 * This is a light adaptation of the original generateFight.ts from labrute.
 */
const generateFight = ({
  team1,
  team2,
  modifiers = [],
  backups = false,
  achievements = false,
  clanWar = false,
}) => {
  // Achievements store
  const achievementsStore = {};
  const fighters = (team1.brutes || []).concat(team2.brutes || []);
  fighters.forEach((brute) => {
    achievementsStore[brute.id] = {
      userId: brute.userId,
      eventId: brute.eventId,
      achievements: {},
    };
  });

  // Backups
  const team1Backups = backups ? selectBackup(team1.backups) : null;
  const team2Backups = backups ? selectBackup(team2.backups) : null;

  // Bosses
  const team1Bosses = expandBosses(team1.bosses);
  const team2Bosses = expandBosses(team2.bosses);

  // Select fighters for the fight (only main fighter vs first opponent)
  const brute1 = (team1.brutes && team1.brutes[0]) || team1Bosses[0];
  const brute2 = (team2.brutes && team2.brutes[0]) || team2Bosses[0];
  if (!brute1 || !brute2) {
    throw new Error('Both teams require at least one fighter');
  }

  // Compute fight
  const manager = new FightManager();
  const fightResult = manager.generateFight(brute1, brute2);

  // Update achievements with simple win/loss tracking
  if (achievements) {
    const winner = fightResult.winner === brute1.name ? brute1 : brute2;
    const loser = winner === brute1 ? brute2 : brute1;
    if (achievementsStore[winner.id]) {
      achievementsStore[winner.id].achievements.wins =
        (achievementsStore[winner.id].achievements.wins || 0) + 1;
    }
    if (achievementsStore[loser.id]) {
      achievementsStore[loser.id].achievements.losses =
        (achievementsStore[loser.id].achievements.losses || 0) + 1;
    }
  }

  // Rewards
  const rewards = { xp: 0, gold: 0 };
  let bossReward;

  if (team1Bosses.length || team2Bosses.length) {
    const bossDefeated = fightResult.winner === brute1.name && team2Bosses.length > 0;
    const gold = bossDefeated ? BOSS_GOLD_REWARD : 0;
    bossReward = { defeated: bossDefeated, xp: 0, gold };
    rewards.gold += gold;
  }

  if (clanWar && fightResult.winner === brute1.name) {
    rewards.xp += 100;
    rewards.gold += 50;
  }

  return {
    steps: fightResult.steps,
    fighters: fightResult.fighters,
    winner: fightResult.winner,
    loser: fightResult.loser,
    achievements: achievements ? achievementsStore : undefined,
    backups: backups
      ? {
        team1: team1Backups ? [team1Backups.id] : [],
        team2: team2Backups ? [team2Backups.id] : [],
      }
      : undefined,
    boss: bossReward,
    rewards,
    modifiers,
  };
};

module.exports = { generateFight, BOSS_GOLD_REWARD };
