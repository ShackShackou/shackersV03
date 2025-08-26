import { promises as fs } from 'fs';
import path from 'path';
import vm from 'vm';
import { LABRUTE_WEAPONS, LABRUTE_PETS } from '../src/engine/labrute-complete.js';

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

function extractArray(source, arrayName, context = {}) {
  const regex = new RegExp(`export const ${arrayName}[^=]*=\\s*(\\[[\\s\\S]*?\n\]);`);
  const match = source.match(regex);
  if (!match) {
    throw new Error(`Could not find array ${arrayName}`);
  }
  const arrayCode = match[1];
  return vm.runInNewContext(arrayCode, context);
}

function toMap(array, key = 'name') {
  return Object.fromEntries(array.map(item => [item[key], item]));
}

function compareWeapons(local, official) {
  const mapping = {
    damage: ['damage', v => v],
    comboRate: ['combo', v => v * 100],
    interval: ['tempo', v => v * 100],
    accuracy: ['accuracy', v => v * 100],
  };
  for (const name of Object.keys(official)) {
    const o = official[name];
    const l = local[name];
    if (!l) {
      console.log(`Missing weapon locally: ${name}`);
      continue;
    }
    for (const [localProp, [officialProp, transform]] of Object.entries(mapping)) {
      if (o[officialProp] !== undefined && l[localProp] !== undefined) {
        const officialVal = transform(o[officialProp]);
        const localVal = Number(l[localProp]);
        if (Math.abs(localVal - officialVal) > 0.001) {
          console.log(`Weapon ${name} ${localProp} mismatch: local ${localVal} vs official ${officialVal}`);
        }
      }
    }
  }
}

function comparePets(local, official) {
  const mapping = {
    damage: ['damage', v => v],
    initiative: ['initiative', v => v],
  };
  for (const name of Object.keys(official)) {
    const o = official[name];
    const l = local[name];
    if (!l) {
      console.log(`Missing pet locally: ${name}`);
      continue;
    }
    for (const [localProp, [officialProp, transform]] of Object.entries(mapping)) {
      if (o[officialProp] !== undefined && l[localProp] !== undefined) {
        const officialVal = transform(o[officialProp]);
        const localVal = Number(l[localProp]);
        if (Math.abs(localVal - officialVal) > 0.001) {
          console.log(`Pet ${name} ${localProp} mismatch: local ${localVal} vs official ${officialVal}`);
        }
      }
    }
  }
}

async function main() {
  const root = await findOfficialRoot();
  const weaponsSrc = await fs.readFile(path.join(root, 'core/src/brute/weapons.ts'), 'utf8');
  const petsSrc = await fs.readFile(path.join(root, 'core/src/brute/pets.ts'), 'utf8');
  const officialWeapons = toMap(extractArray(weaponsSrc, 'weapons'));
  const petContext = { PetName: new Proxy({}, { get: (_, key) => key }) };
  const officialPets = toMap(extractArray(petsSrc, 'pets', petContext));

  console.log('Comparing weapons...');
  compareWeapons(LABRUTE_WEAPONS, officialWeapons);

  console.log('\nComparing pets...');
  comparePets(LABRUTE_PETS, officialPets);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

