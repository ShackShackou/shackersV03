// Auto-sync script
import fs from 'fs';
const labrutePath = '../external/labrute-main/server/src/brute';

function syncData() {
  // Copy weapons.ts to game/weapons.js, adapt format
  fs.copyFileSync(`${labrutePath}/weapons.ts`, 'game/weapons.js');
  // Similar for skills, pets
}
syncData();
