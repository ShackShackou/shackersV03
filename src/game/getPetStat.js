export const scalingByPet = {
  bear: { strength: 0.4, agility: 0.1, speed: 0.1, hp: 0.4 },
  panther: { strength: 0.25, agility: 0.3, speed: 0.3, hp: 0.15 },
  dog3: { strength: 0.1, agility: 0.2, speed: 0.4, hp: 0.1 },
  dog2: { strength: 0.1, agility: 0.2, speed: 0.4, hp: 0.1 },
  dog1: { strength: 0.1, agility: 0.2, speed: 0.4, hp: 0.1 },
};

const petStatToMasterStat = {
  strength: 'strength',
  agility: 'agility',
  speed: 'speed',
  hp: 'maxHealth',
};

export function getPetStat(masterStats, pet, stat) {
  const base = pet[stat];
  const scaling = scalingByPet[pet.name][stat];
  const masterValue = masterStats[petStatToMasterStat[stat]];
  return base + Math.ceil(scaling * masterValue);
}
