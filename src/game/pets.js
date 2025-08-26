import { getPetStat } from './getPetStat.js';

export const PetName = {
  bear: 'bear',
  panther: 'panther',
  dog: 'dog',
};

export const pets = [
  {
    name: PetName.bear,
    displayName: 'Bear',
    enduranceMalus: 8,
    initiative: 3.6,
    strength: 40,
    agility: 2,
    speed: 1,
    counter: 0,
    combo: -0.2,
    block: -0.25,
    evasion: 0.1,
    accuracy: 0.2,
    disarm: 0.05,
    damage: 5,
    hp: 110,
    reach: 1,
    scale: 1.5,
    assistChance: 0.3,
    ability: 'maul',
    description: 'A powerful bear companion that can maul enemies with devastating force'
  },
  {
    name: PetName.panther,
    displayName: 'Panther',
    enduranceMalus: 6,
    initiative: 0.6,
    strength: 23,
    agility: 16,
    speed: 24,
    counter: 0,
    combo: 0.7,
    block: 0,
    evasion: 0.2,
    accuracy: 0,
    disarm: 0,
    damage: 3,
    hp: 26,
    reach: 1,
    scale: 1.2,
    assistChance: 0.4,
    ability: 'pounce',
    description: 'An agile panther that strikes with speed and precision'
  },
  {
    name: PetName.dog,
    displayName: 'Dog',
    enduranceMalus: 2,
    initiative: 0.1,
    strength: 6,
    agility: 5,
    speed: 3,
    counter: 0,
    combo: 0.2,
    block: 0,
    evasion: 0,
    accuracy: 0,
    disarm: 0,
    damage: 3,
    hp: 14,
    reach: 1,
    scale: 0.8,
    assistChance: 0.5,
    ability: 'bite',
    description: 'A loyal dog companion that fights alongside its master'
  },
];

export class Pet {
  constructor(petData, owner, rng) {
    this.name = petData.displayName;
    this.type = petData.name;
    this.owner = owner;
    const hp = getPetStat(owner.stats, petData, 'hp');
    this.stats = {
      hp,
      maxHp: hp,
      strength: getPetStat(owner.stats, petData, 'strength'),
      agility: getPetStat(owner.stats, petData, 'agility'),
      speed: getPetStat(owner.stats, petData, 'speed'),
      initiative: petData.initiative,
      accuracy: petData.accuracy,
      evasion: petData.evasion,
      damage: petData.damage,
      reach: petData.reach,
      counter: petData.counter,
      combo: petData.combo,
      block: petData.block,
      disarm: petData.disarm,
    };
    this.assistChance = petData.assistChance;
    this.ability = petData.ability;
    this.description = petData.description;
    this.scale = petData.scale;
    this.isAlive = true;
    this.combo = petData.combo;
    this.counter = petData.counter;
    this.block = petData.block;
    this.disarm = petData.disarm;
    // Optional seedable RNG (falls back to Math.random if not provided)
    this.rng = rng || null;
  }

  takeDamage(damage) {
    this.stats.hp = Math.max(0, this.stats.hp - damage);
    if (this.stats.hp <= 0) {
      this.isAlive = false;
    }
    return this.stats.hp;
  }

  canAssist() {
    const roll = this.rng ? this.rng.float() : Math.random();
    return this.isAlive && roll < this.assistChance;
  }

  calculateDamage() {
    const baseDamage = this.stats.damage + this.stats.strength * 0.5;
    const variation = 0.8 + (this.rng ? this.rng.float() : Math.random()) * 0.4;
    return Math.floor(baseDamage * variation);
  }

  getAbilityEffect(target) {
    const damage = this.calculateDamage();
    let effect = {
      damage: damage,
      message: '',
      specialEffect: null,
      statusEffect: null
    };

    switch (this.ability) {
      case 'maul':
        effect.damage = Math.floor(damage * 1.5);
        effect.message = `${this.name} mauls the target for ${effect.damage} damage!`;
        effect.specialEffect = 'bleed';
        if ((this.rng ? this.rng.float() : Math.random()) < 0.3) {
          effect.statusEffect = { type: 'bleed', duration: 2, damage: 3 };
        }
        break;

      case 'pounce':
        effect.damage = damage;
        effect.message = `${this.name} pounces for ${damage} damage!`;
        if ((this.rng ? this.rng.float() : Math.random()) < 0.4) {
          effect.statusEffect = { type: 'stun', duration: 1 };
          effect.message += ' Target is stunned!';
        }
        break;

      case 'bite':
        effect.damage = damage;
        effect.message = `${this.name} bites for ${damage} damage!`;
        if ((this.rng ? this.rng.float() : Math.random()) < 0.2) {
          effect.statusEffect = { type: 'weaken', duration: 2, modifier: 0.8 };
        }
        break;

      case 'guard':
        if ((this.rng ? this.rng.float() : Math.random()) < 0.5) {
          this.owner.stats.defense += 5;
          effect.damage = 0;
          effect.message = `${this.name} guards ${this.owner.stats.name}, increasing defense!`;
          effect.specialEffect = 'shield';
        } else {
          effect.damage = damage;
          effect.message = `${this.name} attacks for ${damage} damage!`;
        }
        break;

      default:
        effect.message = `${this.name} attacks for ${damage} damage!`;
    }

    return effect;
  }
}

export function createPet(petType, owner, rng) {
  const petData = pets.find(p => p.name === petType);
  if (!petData) {
    console.error(`Pet type ${petType} not found`);
    return null;
  }
  return new Pet(petData, owner, rng);
}

export function getRandomPet(rng) {
  const weights = [
    { pet: PetName.bear, weight: 10 },
    { pet: PetName.panther, weight: 15 },
    { pet: PetName.dog, weight: 75 },
  ];
  
  const totalWeight = weights.reduce((sum, item) => sum + item.weight, 0);
  let random = (rng ? rng.float() : Math.random()) * totalWeight;
  
  for (const item of weights) {
    random -= item.weight;
    if (random <= 0) {
      return item.pet;
    }
  }
  
  return PetName.dog;
}
