// ================================================
// 🆙 Leveling utilities adapted from LaBrute
// ================================================

import { LABRUTE_PETS } from './labrute-pets.js';
import LABRUTE_SKILLS from './labrute-skills.js';
import LABRUTE_WEAPONS from './labrute-weapons.js';

// Convert data objects to arrays with odds
const pets = Object.keys(LABRUTE_PETS).map((key) => ({
  name: key,
  odds: LABRUTE_PETS[key].odds ?? 1,
}));
const skills = Object.values(LABRUTE_SKILLS);
const weapons = Object.values(LABRUTE_WEAPONS);

// Random utilities
const randomBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const weightedRandom = (items) => {
  const total = items.reduce((acc, item) => acc + (item.odds || 1), 0);
  let threshold = Math.random() * total;
  for (const item of items) {
    threshold -= item.odds || 1;
    if (threshold <= 0) return item;
  }
  return items[0];
};

// Prevent some bonuses based on current brute state
const preventSomeBonuses = (brute, perkType, perkName) => {
  let prevent = false;
  if (perkType === 'pet') {
    // Only one pet allowed
    prevent = brute.pets.includes(perkName);
  } else if (perkType === 'skill') {
    const selectedSkill = skills.find((s) => s.name === perkName);
    const hasSkill = brute.skills.includes(perkName);
    if (hasSkill) {
      prevent = true;
    } else if (selectedSkill?.type === 'booster') {
      const boosters = skills.filter((s) => s.type === 'booster');
      const gottenBoosters = brute.skills.filter((s) => boosters.find((b) => b.name === s));
      switch (gottenBoosters.length) {
        case 0:
          prevent = false;
          break;
        case 1:
          prevent = randomBetween(1, 100) < 95;
          break;
        case 2:
          prevent = randomBetween(1, 100) < 98;
          break;
        default:
          prevent = randomBetween(1, 1000) < 999;
          break;
      }
    }
  } else if (perkType === 'weapon') {
    prevent = brute.weapons.includes(perkName);
  }
  return prevent;
};

export const getRandomBonus = (
  brute,
  rerollUntilFound = false,
  disabledSkills = [],
  disabledWeapons = [],
  disabledPets = [],
) => {
  const enabledSkills = skills.filter((s) => !disabledSkills.includes(s.name));
  const enabledWeapons = weapons.filter((w) => !disabledWeapons.includes(w.name));
  const enabledPets = pets.filter((p) => !disabledPets.includes(p.name));

  const enabledPerksOdds = [
    { name: 'pet', odds: enabledPets.reduce((acc, p) => acc + (p.odds || 1), 0) },
    { name: 'skill', odds: enabledSkills.reduce((acc, s) => acc + (s.odds || 1), 0) },
    { name: 'weapon', odds: enabledWeapons.reduce((acc, w) => acc + (w.odds || 1), 0) },
  ];

  let perkType = weightedRandom(enabledPerksOdds).name;
  let perkName =
    perkType === 'pet'
      ? weightedRandom(enabledPets).name
      : perkType === 'skill'
        ? weightedRandom(enabledSkills).name
        : weightedRandom(enabledWeapons).name;

  let found = !preventSomeBonuses(brute, perkType, perkName);

  while (rerollUntilFound && !found) {
    perkType = weightedRandom(enabledPerksOdds).name;
    perkName =
      perkType === 'pet'
        ? weightedRandom(enabledPets).name
        : perkType === 'skill'
          ? weightedRandom(enabledSkills).name
          : weightedRandom(enabledWeapons).name;
    found = !preventSomeBonuses(brute, perkType, perkName);
  }

  return found ? { type: perkType, name: perkName } : null;
};

const BRUTE_STATS = ['strength', 'agility', 'speed', 'endurance'];

export const getLevelUpChoices = (brute) => {
  let preventPerk = false;
  let perkType = null;
  let perkName = null;

  let firstChoice = null;
  const bruteStats = BRUTE_STATS;
  let secondChoice = {
    type: 'stats',
    stat1: bruteStats[randomBetween(0, bruteStats.length - 1)],
    stat1Value: 2,
  };

  if (brute.level >= 80 && randomBetween(0, brute.level) >= 80) {
    preventPerk = true;
  }

  if (!preventPerk) {
    const perk = getRandomBonus(brute);
    if (perk) {
      perkType = perk.type;
      perkName = perk.name;
    }
    preventPerk = !perk;
  }

  if (preventPerk) {
    const firstStat = bruteStats[randomBetween(0, bruteStats.length - 1)];
    let secondStat = bruteStats[randomBetween(0, bruteStats.length - 1)];
    while (secondStat === firstStat) {
      secondStat = bruteStats[randomBetween(0, bruteStats.length - 1)];
    }
    firstChoice = secondChoice;
    secondChoice = {
      type: 'stats',
      stat1: firstStat,
      stat1Value: 1,
      stat2: secondStat,
      stat2Value: 1,
    };
  } else {
    firstChoice = {
      type: perkType,
      skill: perkType === 'skill' ? perkName : undefined,
      pet: perkType === 'pet' ? perkName : undefined,
      weapon: perkType === 'weapon' ? perkName : undefined,
    };
  }

  return [firstChoice, secondChoice];
};

export default { getRandomBonus, getLevelUpChoices };
