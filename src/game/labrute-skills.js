// ================================================
// 💪 SKILLS/COMPÉTENCES LABRUTE (GÉNÉRÉES)
// ================================================

import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const LABRUTE_SKILLS = JSON.parse(fs.readFileSync(join(__dirname, './data/labrute-skills.json'), 'utf8'));

export { LABRUTE_SKILLS };
export default LABRUTE_SKILLS;
