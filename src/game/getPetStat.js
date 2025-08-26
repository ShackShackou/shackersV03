export const scalingByPet = {
  bear: { strength: 0.4, agility: 0.1, speed: 0.1, hp: 0.4 },
  panther: { strength: 0.25, agility: 0.3, speed: 0.3, hp: 0.15 },
  dog: { strength: 0.1, agility: 0.2, speed: 0.4, hp: 0.1 },
  dog1: { strength: 0.1, agility: 0.2, speed: 0.4, hp: 0.1 },
  dog2: { strength: 0.1, agility: 0.2, speed: 0.4, hp: 0.1 },
  dog3: { strength: 0.1, agility: 0.2, speed: 0.4, hp: 0.1 },
};

const petStatToBruteStat = {
  strength: 'strength',
  agility: 'agility',
  speed: 'speed',
  hp: 'maxHealth',
};

export function getPetStat(bruteStats, petData, stat) {
  const base = petData[stat] || 0;
  const scaling = scalingByPet[petData.name]?.[stat] || 0;
  const bruteStatKey = petStatToBruteStat[stat];
  let bruteValue = bruteStats[bruteStatKey];
  if (bruteValue === undefined && stat === 'hp') {
    bruteValue = bruteStats.health || bruteStats.maxHealth;
  }
  if (typeof bruteValue !== 'number') bruteValue = 0;
  return base + Math.ceil(scaling * bruteValue);
}
