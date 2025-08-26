import test from 'node:test';
import assert from 'node:assert/strict';
import { pets, PetName, createPet } from './pets.js';
import { getPetStat, scalingByPet } from './getPetStat.js';

test('getPetStat applies scaling based on owner stats', () => {
  const ownerStats = { strength: 10, agility: 20, speed: 30, maxHealth: 100 };
  const dogData = pets.find(p => p.name === PetName.dog);
  assert.equal(
    getPetStat(ownerStats, dogData, 'strength'),
    dogData.strength + Math.ceil(scalingByPet[PetName.dog].strength * ownerStats.strength)
  );
  assert.equal(
    getPetStat(ownerStats, dogData, 'agility'),
    dogData.agility + Math.ceil(scalingByPet[PetName.dog].agility * ownerStats.agility)
  );
  assert.equal(
    getPetStat(ownerStats, dogData, 'speed'),
    dogData.speed + Math.ceil(scalingByPet[PetName.dog].speed * ownerStats.speed)
  );
  assert.equal(
    getPetStat(ownerStats, dogData, 'hp'),
    dogData.hp + Math.ceil(scalingByPet[PetName.dog].hp * ownerStats.maxHealth)
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

