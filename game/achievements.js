// Achievements system
export const achievements = {
  bossKiller: { condition: 'defeat boss', reward: 'title' }
};

export function checkAchievements(steps, fighter) {
  // Check steps for events
  if (steps.some(s => s.type === 'boss_defeat')) {
    return ['bossKiller'];
  }
  return [];
}
