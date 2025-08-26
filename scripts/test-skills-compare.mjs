import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SkillModifiers } from '../src/game/skills.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Map of FightStat enum keys to their string values
const fightStatMap = {
  REVERSAL: 'reversal',
  COUNTER: 'counter',
  EVASION: 'evasion',
  DEXTERITY: 'dexterity',
  BLOCK: 'block',
  ACCURACY: 'accuracy',
  DISARM: 'disarm',
  COMBO: 'combo',
  DEFLECT: 'deflect',
  ARMOR: 'armor',
  DAMAGE: 'damage',
  CRITICAL_CHANCE: 'criticalChance',
  CRITICAL_DAMAGE: 'criticalDamage',
  HIT_SPEED: 'hitSpeed',
  INITIATIVE: 'initiative',
  STRENGTH: 'strength',
  AGILITY: 'agility',
  SPEED: 'speed',
  ENDURANCE: 'endurance',
  REGENERATION: 'regeneration',
};

const officialPath = path.resolve(__dirname, '../external/labrute-main-20250820-001440/labrute-main/core/src/brute/skills.ts');
const content = fs.readFileSync(officialPath, 'utf8');

// Extract SkillModifiers object from official file
const match = content.match(/export const SkillModifiers[^=]*= ({[\s\S]*?});\n\nexport const SkillDamageModifiers/);
if (!match) {
  console.error('Failed to locate SkillModifiers in official file');
  process.exit(1);
}

let objStr = match[1]
  .replace(/\[SkillName\.([a-zA-Z0-9_]+)\]/g, '"$1"')
  .replace(/\[FightStat\.([A-Z_]+)\]/g, (_, p1) => `"${fightStatMap[p1]}"`)
  .replace(/WeaponType\.([A-Z_]+)/g, (_, p1) => `"${p1.toLowerCase()}"`);

// Evaluate sanitized object
const official = eval('(' + objStr + ')');

const differences = [];
for (const [skill, mods] of Object.entries(official)) {
  const ours = SkillModifiers[skill] || {};
  if (JSON.stringify(ours) !== JSON.stringify(mods)) {
    differences.push({ skill, official: JSON.stringify(mods), ours: JSON.stringify(ours) });
  }
}

console.log('Total skills compared:', Object.keys(official).length);
if (differences.length) {
  console.table(differences);
  console.error(`Differences found: ${differences.length}`);
  process.exitCode = 1;
} else {
  console.log('All skill modifiers match official values!');
}

