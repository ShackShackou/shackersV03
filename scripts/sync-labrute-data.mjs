import { promises as fs } from 'fs';
import path from 'path';
import vm from 'vm';

async function findOfficialRoot() {
  const base = path.resolve('external');
  const entries = await fs.readdir(base, { withFileTypes: true }).catch(() => []);
  const dirs = entries.filter(e => e.isDirectory() && e.name.startsWith('labrute-main-')).map(e => e.name);
  if (dirs.length === 0) {
    throw new Error('No labrute-main-* directory found in external/');
  }
  dirs.sort();
  return path.join(base, dirs[dirs.length - 1], 'labrute-main');
}

function extractArray(source, arrayName) {
  const regex = new RegExp(`export const ${arrayName}[^=]*=\\s*(\\[[\\s\\S]*?\n\]);`);
  const match = source.match(regex);
  if (!match) {
    throw new Error(`Could not find array ${arrayName}`);
  }
  const arrayCode = match[1];
  return vm.runInNewContext(arrayCode);
}

async function writeJson(data, outPath) {
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, JSON.stringify(data, null, 2));
}

async function main() {
  const root = await findOfficialRoot();
  const weaponsSrc = await fs.readFile(path.join(root, 'core/src/brute/weapons.ts'), 'utf8');
  const skillsSrc = await fs.readFile(path.join(root, 'core/src/brute/skills.ts'), 'utf8');

  const weaponsArray = extractArray(weaponsSrc, 'weapons');
  const skillsArray = extractArray(skillsSrc, 'skills');

  const weaponsObj = Object.fromEntries(weaponsArray.map(w => [w.name, w]));
  const skillsObj = Object.fromEntries(skillsArray.map(s => [s.name, s]));

  await writeJson(weaponsObj, 'src/game/data/labrute-weapons.json');
  await writeJson(skillsObj, 'src/game/data/labrute-skills.json');
  console.log('Synced official LaBrute weapons and skills.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
