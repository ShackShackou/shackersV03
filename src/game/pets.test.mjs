import test from 'node:test';
import assert from 'node:assert';
import { PetName, pets, createPet, getRandomPet } from './pets.js';
import { getPetStat } from './getPetStat.js';

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
