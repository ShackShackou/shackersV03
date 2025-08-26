// Constants and enums for the LaBrute engine - Converted from @labrute/core

// Step types for fight animation
const StepType = {
  Arrive: 'arrive',
  End: 'end',
  Hit: 'hit',
  Block: 'block',
  Evade: 'evade',
  Move: 'move',
  MoveBack: 'moveBack',
  Throw: 'throw',
  Death: 'death',
  Counter: 'counter',
  Equip: 'equip',
  Trash: 'trash',
  Steal: 'steal',
  Disarm: 'disarm',
  Sabotage: 'sabotage',
  Saboteur: 'saboteur',
  SkillActivate: 'skillActivate',
  SkillExpire: 'skillExpire',
  Spy: 'spy',
  Trap: 'trap',
  Bomb: 'bomb',
  Hammer: 'hammer',
  FlashFlood: 'flashFlood',
  Haste: 'haste',
  Vampirism: 'vampirism',
  Heal: 'heal',
  Regeneration: 'regeneration',
  Eat: 'eat',
  Treat: 'treat',
  Leave: 'leave',
  Resist: 'resist',
  Survive: 'survive',
  DropShield: 'dropShield',
  AttemptHit: 'attemptHit',
  Hypnotise: 'hypnotise',
  Poison: 'poison'
};

// Weapon types
const WeaponType = {
  SHARP: 'sharp',
  HEAVY: 'heavy',
  LONG: 'long',
  THROWN: 'thrown',
  BLUNT: 'blunt',
  FAST: 'fast'
};

// Pet names
const PetName = {
  dog1: 'dog1',
  dog2: 'dog2',
  dog3: 'dog3',
  panther: 'panther',
  bear: 'bear'
};

// Skill names
const SkillName = {
  // Combat skills
  hammer: 'hammer',
  thief: 'thief',
  fierceBrute: 'fierceBrute',
  tragicPotion: 'tragicPotion',
  net: 'net',
  bomb: 'bomb',
  cryOfTheDamned: 'cryOfTheDamned',
  hypnosis: 'hypnosis',
  flashFlood: 'flashFlood',
  tamer: 'tamer',
  vampirism: 'vampirism',
  haste: 'haste',
  treat: 'treat',
  
  // Passive skills
  weaponsMaster: 'weaponsMaster',
  martialArts: 'martialArts',
  leadSkeleton: 'leadSkeleton',
  chaining: 'chaining',
  counterAttack: 'counterAttack',
  bodybuilder: 'bodybuilder',
  hideaway: 'hideaway',
  survival: 'survival',
  resistant: 'resistant',
  shield: 'shield',
  chef: 'chef',
  backup: 'backup'
};

// Weapon names
const WeaponName = {
  // Basic weapons
  mug: 'mug',
  knife: 'knife',
  broadsword: 'broadsword',
  fan: 'fan',
  keyboard: 'keyboard',
  leek: 'leek',
  mace: 'mace',
  sai: 'sai',
  racquet: 'racquet',
  axe: 'axe',
  bumps: 'bumps',
  flail: 'flail',
  fryingPan: 'fryingPan',
  hatchet: 'hatchet',
  lance: 'lance',
  trident: 'trident',
  whip: 'whip',
  noodleBowl: 'noodleBowl',
  piopio: 'piopio',
  shuriken: 'shuriken',
  trombone: 'trombone',
  baton: 'baton',
  halbard: 'halbard',
  mammothBone: 'mammothBone',
  potatoesBasket: 'potatoesBasket',
  stick: 'stick'
};

// Fight modifiers
const FightModifier = {
  focusOpponent: 'focusOpponent',
  alwaysUseSupers: 'alwaysUseSupers',
  drawEveryWeapon: 'drawEveryWeapon',
  noThrows: 'noThrows',
  bareHandsFirstHit: 'bareHandsFirstHit',
  startWithWeapon: 'startWithWeapon'
};

// Fight stats
const FightStat = {
  HIT_SPEED: 'hitSpeed',
  INITIATIVE: 'initiative',
  STRENGTH: 'strength',
  AGILITY: 'agility',
  SPEED: 'speed',
  HP: 'hp',
  ACCURACY: 'accuracy',
  BLOCK: 'block',
  COMBO: 'combo',
  COUNTER: 'counter',
  CRITICAL_CHANCE: 'critical',
  CRITICAL_DAMAGE: 'criticalDamage',
  DEFLECT: 'deflect',
  DISARM: 'disarm',
  EVASION: 'evasion',
  REVERSAL: 'reversal',
  TEMPO: 'tempo',
  DEXTERITY: 'dexterity'
};

// Random utility functions
const randomBetween = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const randomItem = (array) => {
  if (!array || array.length === 0) return null;
  return array[Math.floor(Math.random() * array.length)];
};

const weightedRandom = (items) => {
  if (!items || items.length === 0) return null;
  
  const totalWeight = items.reduce((sum, item) => sum + (item.weight || 1), 0);
  const random = Math.random() * totalWeight;
  
  let currentWeight = 0;
  for (const item of items) {
    currentWeight += item.weight || 1;
    if (random <= currentWeight) {
      return item;
    }
  }
  
  return items[items.length - 1];
};

module.exports = {
  StepType,
  WeaponType,
  PetName,
  SkillName,
  WeaponName,
  FightModifier,
  FightStat,
  randomBetween,
  randomItem,
  weightedRandom
};