import test from 'node:test';
import assert from 'node:assert/strict';
import { pets, PetName, createPet, getRandomPet } from './pets.js';
import { getPetStat, scalingByPet } from './getPetStat.js';

// Helper master stats
const master = {
  stats: {
    name: 'Master',
    strength: 100,
    agility: 50,
    speed: 40,
    maxHealth: 200,
  }
};

test('getPetStat applies scaling based on owner stats', () => {
  const ownerStats = { strength: 10, agility: 20, speed: 30, maxHealth: 100 };
  const dogData = pets.find(p => p.name === PetName.dog1);
  assert.equal(
    getPetStat(ownerStats, dogData, 'strength'),
    dogData.strength + Math.ceil(scalingByPet[PetName.dog1].strength * ownerStats.strength)
  );
  assert.equal(
    getPetStat(ownerStats, dogData, 'agility'),
    dogData.agility + Math.ceil(scalingByPet[PetName.dog1].agility * ownerStats.agility)
  );
  assert.equal(
    getPetStat(ownerStats, dogData, 'speed'),
    dogData.speed + Math.ceil(scalingByPet[PetName.dog1].speed * ownerStats.speed)
  );
  assert.equal(
    getPetStat(ownerStats, dogData, 'hp'),
    dogData.hp + Math.ceil(scalingByPet[PetName.dog1].hp * ownerStats.maxHealth)
  );
});

test('pet stats increase with stronger owner', () => {
  const weakOwner = { stats: { strength: 5, agility: 5, speed: 5, maxHealth: 50 } };
  const strongOwner = { stats: { strength: 20, agility: 20, speed: 20, maxHealth: 200 } };
  const weakPet = createPet(PetName.bear, weakOwner);
  const strongPet = createPet(PetName.bear, strongOwner);
  assert.ok(strongPet.stats.strength > weakPet.stats.strength);
  assert.ok(strongPet.stats.agility > weakPet.stats.agility);
  assert.ok(strongPet.stats.speed > weakPet.stats.speed);
  assert.ok(strongPet.stats.hp > weakPet.stats.hp);
});

test('pet stats are derived from master', () => {
  const pet = createPet(PetName.bear, master);
  const data = pets.find(p => p.name === PetName.bear);
  assert.strictEqual(pet.stats.strength, getPetStat(master.stats, data, 'strength'));
  assert.strictEqual(pet.stats.agility, getPetStat(master.stats, data, 'agility'));
  assert.strictEqual(pet.stats.speed, getPetStat(master.stats, data, 'speed'));
  assert.strictEqual(pet.stats.maxHp, getPetStat(master.stats, data, 'hp'));
});

test('getRandomPet returns generic dog when selecting dog', () => {
  const rng = { float: () => 0.9 }; // ensures dog is selected
  assert.strictEqual(getRandomPet(rng), PetName.dog);
});
