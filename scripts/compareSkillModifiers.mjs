import fs from 'fs';
import path from 'path';
import os from 'os';
import { pathToFileURL } from 'url';
import ts from 'typescript';

const { SkillModifiers: local } = await import('../src/game/skills.js');

const tsPath = path.resolve(
  'external/labrute-main-20250820-001440/labrute-main/core/src/brute/skills.ts',
);
let tsSource = fs.readFileSync(tsPath, 'utf8');
const start = tsSource.indexOf('export const SkillModifiers');
const end = tsSource.indexOf('export const SkillDamageModifiers');
tsSource = tsSource.slice(start, end)
  .replace('export const SkillModifiers', 'const SkillModifiers')
  .concat('\nexport { SkillModifiers };');

tsSource = tsSource.replace(/\[SkillName\.([a-zA-Z0-9_]+)\]/g, (_, p1) => `'${p1}'`)
  .replace(/WeaponType\.SHARP/g, `'sharp'`)
  .replace(/WeaponType\.HEAVY/g, `'heavy'`)
  .replace(/WeaponType\.BLUNT/g, `'blunt'`);

const statMap = {
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
for (const [k, v] of Object.entries(statMap)) {
  tsSource = tsSource.replace(new RegExp(`\\[FightStat\\.${k}\\]`, 'g'), `'${v}'`);
}

const transpiled = ts.transpileModule(tsSource, {
  compilerOptions: { module: ts.ModuleKind.ESNext },
}).outputText;

const tmpFile = path.join(os.tmpdir(), 'skills.tmp.mjs');
fs.writeFileSync(tmpFile, transpiled, 'utf8');
const coreModule = await import(pathToFileURL(tmpFile));
fs.unlinkSync(tmpFile);
const core = coreModule.SkillModifiers;

const diffs = [];
for (const skill of Object.keys(core)) {
  const coreMods = core[skill];
  const localMods = local[skill];
  if (!localMods) {
    diffs.push(`missing skill ${skill}`);
    continue;
  }
  for (const stat of Object.keys(coreMods)) {
    const coreStat = coreMods[stat];
    const localStat = localMods[stat];
    if (!localStat) {
      diffs.push(`missing stat ${skill}.${stat}`);
      continue;
    }
    const keys = new Set([...Object.keys(coreStat), ...Object.keys(localStat)]);
    for (const key of keys) {
      if (coreStat[key] !== localStat[key]) {
        diffs.push(`mismatch ${skill}.${stat}.${key}: expected ${coreStat[key]} got ${localStat[key]}`);
      }
    }
  }
}

if (diffs.length) {
  console.error('Differences found:\n' + diffs.join('\n'));
  process.exit(1);
}

console.log('All skill modifiers match official data.');
