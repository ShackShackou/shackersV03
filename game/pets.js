// Import full LaBrute pets
import { LABRUTE_PETS } from '../engine/labrute-complete.js';
export const pets = { ...LABRUTE_PETS };

// Add respawn and synergies
Object.keys(pets).forEach(key => {
  pets[key].respawnChance = 0.3; // Example
  pets[key].synergies = pets[key].synergies || []; // e.g., ['tamer']
});
// Add multi-instance and IA function
export function createPet(type, owner, rng) {
  const pet = { ...pets[type], owner, isAlive: true };
  pet.selectTarget = () => { /* Implement getRandomOpponent logic */ };
  return pet;
}
