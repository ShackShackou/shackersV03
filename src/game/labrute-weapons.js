// ================================================
// 🗡️ ARMES OFFICIELLES LABRUTE (GÉNÉRÉES)
// ================================================

import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const LABRUTE_WEAPONS = JSON.parse(fs.readFileSync(join(__dirname, './data/labrute-weapons.json'), 'utf8'));

export { LABRUTE_WEAPONS };
export default LABRUTE_WEAPONS;
