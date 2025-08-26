import { WeaponType } from './weapons.js';

// Official skill names from LaBrute core
export const SkillName = {
  herculeanStrength: 'herculeanStrength',
  felineAgility: 'felineAgility',
  lightningBolt: 'lightningBolt',
  vitality: 'vitality',
  immortality: 'immortality',
  reconnaissance: 'reconnaissance',
  weaponsMaster: 'weaponsMaster',
  martialArts: 'martialArts',
  sixthSense: 'sixthSense',
  hostility: 'hostility',
  fistsOfFury: 'fistsOfFury',
  shield: 'shield',
  armor: 'armor',
  toughenedSkin: 'toughenedSkin',
  untouchable: 'untouchable',
  sabotage: 'sabotage',
  shock: 'shock',
  bodybuilder: 'bodybuilder',
  relentless: 'relentless',
  survival: 'survival',
  leadSkeleton: 'leadSkeleton',
  balletShoes: 'balletShoes',
  determination: 'determination',
  firstStrike: 'firstStrike',
  resistant: 'resistant',
  counterAttack: 'counterAttack',
  ironHead: 'ironHead',
  thief: 'thief',
  fierceBrute: 'fierceBrute',
  tragicPotion: 'tragicPotion',
  net: 'net',
  bomb: 'bomb',
  hammer: 'hammer',
  cryOfTheDamned: 'cryOfTheDamned',
  hypnosis: 'hypnosis',
  flashFlood: 'flashFlood',
  tamer: 'tamer',
  regeneration: 'regeneration',
  chef: 'chef',
  spy: 'spy',
  saboteur: 'saboteur',
  backup: 'backup',
  hideaway: 'hideaway',
  monk: 'monk',
  vampirism: 'vampirism',
  chaining: 'chaining',
  haste: 'haste',
  treat: 'treat',
  repulse: 'repulse',
  fastMetabolism: 'fastMetabolism',
};

// Official fight stat identifiers
export const FightStat = {
  REVERSAL: 'reversal',
  COUNTER: 'counter',
  EVASION: 'evasion',
  DEXTERITY: 'dexterity',
  BLOCK: 'block',
  ACCURACY: 'accuracy',
  DISARM: 'disarm',
  COMBO: 'combo',
  DEFLECT: 'deflect',
  ARMOR: 'armor',
  DAMAGE: 'damage',
  CRITICAL_CHANCE: 'criticalChance',
  CRITICAL_DAMAGE: 'criticalDamage',
  HIT_SPEED: 'hitSpeed',
  INITIATIVE: 'initiative',
  STRENGTH: 'strength',
  AGILITY: 'agility',
  SPEED: 'speed',
  ENDURANCE: 'endurance',
  REGENERATION: 'regeneration',
};

// Skill modifiers copied from official LaBrute core (units preserved)
export const SkillModifiers = {
  [SkillName.herculeanStrength]: {
    [FightStat.STRENGTH]: { flat: 3, percent: 0.5 },
  },
  [SkillName.felineAgility]: {
    [FightStat.AGILITY]: { flat: 3, percent: 0.5 },
  },
  [SkillName.lightningBolt]: {
    [FightStat.SPEED]: { flat: 3, percent: 0.5 },
  },
  [SkillName.vitality]: {
    [FightStat.ENDURANCE]: { flat: 3, percent: 0.5 },
  },
  [SkillName.immortality]: {
    [FightStat.ENDURANCE]: { percent: 2.5 },
    [FightStat.STRENGTH]: { percent: -0.25 },
    [FightStat.AGILITY]: { percent: -0.25 },
    [FightStat.SPEED]: { percent: -0.25 },
  },
  [SkillName.weaponsMaster]: {
    [FightStat.DAMAGE]: { percent: 0.5, weaponType: WeaponType.SHARP },
  },
  [SkillName.martialArts]: {
    [FightStat.DAMAGE]: { percent: 1, weaponType: null },
  },
  [SkillName.sixthSense]: {
    [FightStat.COUNTER]: { percent: 0.1 },
  },
  [SkillName.hostility]: {
    [FightStat.REVERSAL]: { percent: 0.3 },
  },
  [SkillName.fistsOfFury]: {
    [FightStat.COMBO]: { percent: 0.2 },
  },
  [SkillName.shield]: {
    [FightStat.BLOCK]: { percent: 0.45 },
    [FightStat.DAMAGE]: { percent: -0.25 },
  },
  [SkillName.armor]: {
    [FightStat.ARMOR]: { percent: 0.25 },
    [FightStat.SPEED]: { percent: -0.15 },
  },
  [SkillName.toughenedSkin]: {
    [FightStat.ARMOR]: { percent: 0.1 },
  },
  [SkillName.untouchable]: {
    [FightStat.EVASION]: { percent: 0.3 },
  },
  [SkillName.sabotage]: {},
  [SkillName.shock]: {
    [FightStat.DISARM]: { percent: 0.5 },
  },
  [SkillName.bodybuilder]: {
    [FightStat.HIT_SPEED]: { percent: 0.40, weaponType: WeaponType.HEAVY },
    [FightStat.DEXTERITY]: { percent: 0.1, weaponType: WeaponType.HEAVY },
  },
  [SkillName.relentless]: {
    [FightStat.ACCURACY]: { percent: 0.3 },
  },
  [SkillName.survival]: {
    [FightStat.BLOCK]: { percent: 0.2, details: 'atOneHp' },
    [FightStat.EVASION]: { percent: 0.2, details: 'atOneHp' },
  },
  [SkillName.leadSkeleton]: {
    [FightStat.ARMOR]: { percent: 0.15 },
    [FightStat.DAMAGE]: { percent: -0.15, weaponType: WeaponType.BLUNT, opponent: true },
    [FightStat.EVASION]: { percent: -0.15 },
  },
  [SkillName.balletShoes]: {
    [FightStat.EVASION]: { percent: 0.1 },
  },
  [SkillName.determination]: {},
  [SkillName.firstStrike]: {
    [FightStat.INITIATIVE]: { flat: 200 },
  },
  [SkillName.resistant]: {},
  [SkillName.reconnaissance]: {
    [FightStat.INITIATIVE]: { flat: -200 },
    [FightStat.SPEED]: { flat: 5, percent: 1.5 },
    [FightStat.CRITICAL_DAMAGE]: { percent: 0.5 },
  },
  [SkillName.counterAttack]: {
    [FightStat.BLOCK]: { percent: 0.1 },
    [FightStat.REVERSAL]: { percent: 0.9, details: 'afterBlock' },
  },
  [SkillName.ironHead]: {},
  [SkillName.thief]: {},
  [SkillName.fierceBrute]: {
    [FightStat.CRITICAL_CHANCE]: { percent: 0.1 },
  },
  [SkillName.tragicPotion]: {},
  [SkillName.net]: {},
  [SkillName.bomb]: {},
  [SkillName.hammer]: {},
  [SkillName.cryOfTheDamned]: {},
  [SkillName.hypnosis]: {},
  [SkillName.flashFlood]: {},
  [SkillName.tamer]: {},
  [SkillName.regeneration]: {},
  [SkillName.chef]: {},
  [SkillName.spy]: {},
  [SkillName.saboteur]: {},
  [SkillName.backup]: {},
  [SkillName.hideaway]: {
    [FightStat.BLOCK]: { percent: 0.25, details: 'againstThrows' },
  },
  [SkillName.monk]: {
    [FightStat.COUNTER]: { percent: 0.4 },
    [FightStat.INITIATIVE]: { flat: -200 },
    [FightStat.HIT_SPEED]: { percent: -1 },
  },
  [SkillName.vampirism]: {},
  [SkillName.chaining]: {},
  [SkillName.haste]: {
    [FightStat.CRITICAL_CHANCE]: { percent: 0.05 },
  },
  [SkillName.treat]: {},
  [SkillName.repulse]: {
    [FightStat.DEFLECT]: { percent: 0.3 },
    [FightStat.CRITICAL_CHANCE]: { percent: 0.05 },
  },
  [SkillName.fastMetabolism]: {
    [FightStat.REGENERATION]: { percent: 0.01 },
    [FightStat.HIT_SPEED]: { percent: -0.5 },
    [FightStat.CRITICAL_CHANCE]: { percent: -0.05 },
  },
};

export function applySkillModifiers(fighter, skill) {
  const modifiers = SkillModifiers[skill];
  if (!modifiers) return fighter;

  const updatedFighter = { ...fighter };

  Object.entries(modifiers).forEach(([stat, modifier]) => {
    switch (stat) {
      case FightStat.ENDURANCE:
        if (modifier.flat) updatedFighter.stats.maxHealth += modifier.flat * 2;
        if (modifier.percent) updatedFighter.stats.maxHealth *= (1 + modifier.percent);
        updatedFighter.stats.health = Math.min(updatedFighter.stats.health, updatedFighter.stats.maxHealth);
        break;
      case FightStat.STRENGTH:
        if (modifier.flat) updatedFighter.stats.strength += modifier.flat;
        if (modifier.percent) updatedFighter.stats.strength *= (1 + modifier.percent);
        break;
      case FightStat.AGILITY:
        if (modifier.flat) updatedFighter.stats.agility += modifier.flat;
        if (modifier.percent) updatedFighter.stats.agility *= (1 + modifier.percent);
        break;
      case FightStat.SPEED:
        if (modifier.flat) updatedFighter.stats.speed = (updatedFighter.stats.speed || 10) + modifier.flat;
        if (modifier.percent) updatedFighter.stats.speed = (updatedFighter.stats.speed || 10) * (1 + modifier.percent);
        break;
      case FightStat.COUNTER:
        if (!updatedFighter.stats.counter) updatedFighter.stats.counter = 0;
        if (modifier.flat) updatedFighter.stats.counter += modifier.flat;
        if (modifier.percent) updatedFighter.stats.counter += modifier.percent;
        break;
      case FightStat.COMBO:
        if (!updatedFighter.stats.combo) updatedFighter.stats.combo = 0;
        if (modifier.flat) updatedFighter.stats.combo += modifier.flat;
        if (modifier.percent) updatedFighter.stats.combo += modifier.percent;
        break;
      case FightStat.BLOCK:
        if (modifier.flat) updatedFighter.stats.defense += modifier.flat * 5;
        if (modifier.percent) updatedFighter.stats.blockChance = (updatedFighter.stats.blockChance || 0) + modifier.percent;
        break;
      case FightStat.EVASION:
        if (modifier.percent) updatedFighter.stats.evasionBonus = (updatedFighter.stats.evasionBonus || 0) + modifier.percent;
        break;
      case FightStat.ACCURACY:
        if (modifier.percent) updatedFighter.stats.accuracyBonus = (updatedFighter.stats.accuracyBonus || 0) + modifier.percent;
        break;
      case FightStat.DISARM:
        if (modifier.percent) updatedFighter.stats.disarmChance = (updatedFighter.stats.disarmChance || 0) + modifier.percent;
        break;
      case FightStat.INITIATIVE:
        if (modifier.flat) updatedFighter.stats.initiative = (updatedFighter.stats.initiative || 0) + modifier.flat;
        break;
      case FightStat.DEXTERITY:
        if (modifier.percent) updatedFighter.stats.dexterityBonus = (updatedFighter.stats.dexterityBonus || 0) + modifier.percent;
        break;
      case FightStat.REVERSAL:
        if (modifier.percent) updatedFighter.stats.reversalChance = (updatedFighter.stats.reversalChance || 0) + modifier.percent;
        break;
      case FightStat.CRITICAL_CHANCE:
        if (modifier.percent) updatedFighter.stats.criticalChance = (updatedFighter.stats.criticalChance || 0) + modifier.percent;
        break;
      case FightStat.CRITICAL_DAMAGE:
        if (modifier.percent) updatedFighter.stats.criticalDamage = (updatedFighter.stats.criticalDamage || 0) + modifier.percent;
        break;
      case FightStat.REGENERATION:
        if (modifier.percent) updatedFighter.stats.regeneration = (updatedFighter.stats.regeneration || 0) + modifier.percent;
        break;
    }
  });

  // Ensure stats don't go below minimum values
  updatedFighter.stats.strength = Math.max(1, Math.floor(updatedFighter.stats.strength));
  updatedFighter.stats.agility = Math.max(0, Math.floor(updatedFighter.stats.agility));
  updatedFighter.stats.defense = Math.max(0, Math.floor(updatedFighter.stats.defense));
  updatedFighter.stats.health = Math.max(1, Math.floor(updatedFighter.stats.health));
  updatedFighter.stats.maxHealth = Math.max(1, Math.floor(updatedFighter.stats.maxHealth));

  return updatedFighter;
}

export function getRandomSkill(excludeSkills = []) {
  const availableSkills = Object.keys(SkillName).filter((skill) => !excludeSkills.includes(skill));
  const randomIndex = Math.floor(Math.random() * availableSkills.length);
  return SkillName[availableSkills[randomIndex]];
}

export const skillDescriptions = {
  [SkillName.herculeanStrength]: 'Massive strength boost (+50% STR, +3 flat)',
  [SkillName.felineAgility]: 'Enhanced agility (+50% AGI, +3 flat)',
  [SkillName.lightningBolt]: 'Lightning speed (+50% SPD, +3 flat)',
  [SkillName.vitality]: 'Increased health (+50% END, +3 flat)',
  [SkillName.immortality]: 'Massive health boost (+250% END) but weakens other stats',
  [SkillName.weaponsMaster]: 'Better weapon handling with sharp weapons',
  [SkillName.martialArts]: 'Master of combos and counters',
  [SkillName.sixthSense]: 'Enhanced defensive awareness',
  [SkillName.hostility]: 'Increased aggression and reversals',
  [SkillName.fistsOfFury]: 'Combo specialist',
  [SkillName.shield]: 'Strong blocking ability (+45%)',
  [SkillName.armor]: 'Good protection but slower',
  [SkillName.toughenedSkin]: 'Natural armor (+10%)',
  [SkillName.untouchable]: 'Hard to hit (+30% evasion)',
  [SkillName.shock]: 'Disarms enemies',
  [SkillName.bodybuilder]: 'Stronger with heavy weapons',
  [SkillName.relentless]: 'Accuracy boost (+30%)',
  [SkillName.survival]: 'Bonuses when at 1 HP',
  [SkillName.leadSkeleton]: 'Heavy but durable',
  [SkillName.balletShoes]: 'Graceful dodger',
  [SkillName.firstStrike]: 'Always attacks first',
  [SkillName.reconnaissance]: 'Scout: much faster but fragile',
  [SkillName.counterAttack]: 'Counter specialist',
  [SkillName.fierceBrute]: 'Higher critical chance (+10%)',
  [SkillName.hideaway]: 'Can hide against throws',
  [SkillName.monk]: 'Counter-focused but slower attacks',
  [SkillName.haste]: 'Slight critical chance boost',
  [SkillName.repulse]: 'Deflects attacks and boosts crit chance',
  [SkillName.fastMetabolism]: 'Regenerates health each turn',
};

