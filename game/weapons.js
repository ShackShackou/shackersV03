// Import full LaBrute weapons
import { LABRUTE_WEAPONS } from '../engine/labrute-complete.js';
export const weapons = { ...LABRUTE_WEAPONS };

// Add rarities and wear
Object.keys(weapons).forEach(key => {
  weapons[key].rarity = weapons[key].rarity || 'common'; // Example: add if missing
  weapons[key].durability = weapons[key].durability || 100;
  weapons[key].thrown = ['shuriken', 'piopio', 'noodleBowl'].includes(key);
});
