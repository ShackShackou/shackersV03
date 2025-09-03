import { readFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';

export type WeaponData = {
  name: string;
  tempo: number;
  accuracy: number;
  criticalDamage: number;
  damage: number;
  reach: number;
};

function readJsonSafe(path: string) {
  try { return JSON.parse(readFileSync(path, 'utf-8')); } catch { return null; }
}

function resolveDataPath(file: string) {
  const cwd = process.cwd();
  const candidates = [
    resolve(cwd, 'server', 'data', file),
    resolve(cwd, 'data', file),
  ];
  for (const p of candidates) { if (existsSync(p)) return p; }
  return null;
}

export function loadOfficialWeapons(baseDir?: string): Record<string, WeaponData> | null {
  // Prefer JSON data if present
  const jsonPath = resolveDataPath('weapons.json');
  if (jsonPath) {
    const arr = readJsonSafe(jsonPath) as any[] | null;
    if (Array.isArray(arr) && arr.length) {
      const out: Record<string, WeaponData> = {};
      for (const it of arr) out[it.name] = it as WeaponData;
      return out;
    }
  }
  try {
    const dir = baseDir || process.env.OFFICIAL_DATA_DIR || 'C:/Users/thesh/OneDrive/Documents/CODES/__ROSEBUD-AI-LABRUTE/fichiers_labrute-officiel/labrute/core/src/brute';
    const file = join(dir, 'weapons.ts');
    if (!existsSync(file)) return null;
    const src = readFileSync(file, 'utf-8');
    const map: Record<string, WeaponData> = {};
    const rx = /(\b[a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*\{[^}]*?tempo:\s*([0-9.]+)[^}]*?accuracy:\s*([0-9.\-]+)[^}]*?criticalDamage:\s*([0-9.\-]+)[^}]*?damage:\s*([0-9.\-]+)[^}]*?reach:\s*([0-9.\-]+)[^}]*?\}/gms;
    let m: RegExpExecArray | null;
    while ((m = rx.exec(src))) {
      const name = m[1];
      const tempo = parseFloat(m[2]);
      const accuracy = parseFloat(m[3]);
      const criticalDamage = parseFloat(m[4]);
      const damage = parseFloat(m[5]);
      const reach = parseFloat(m[6]);
      map[name] = { name, tempo, accuracy, criticalDamage, damage, reach };
    }
    return Object.keys(map).length ? map : null;
  } catch {
    return null;
  }
}

export type SkillData = {
  name: string;
  type?: string; // super | passive | talent
  uses?: number;
  toss?: number;
};

export function loadOfficialSkills(baseDir?: string): Record<string, SkillData> | null {
  const jsonPath = resolveDataPath('skills.json');
  if (jsonPath) {
    const arr = readJsonSafe(jsonPath) as any[] | null;
    if (Array.isArray(arr) && arr.length) {
      const out: Record<string, SkillData> = {};
      for (const it of arr) out[it.name] = it as SkillData;
      return out;
    }
  }
  try {
    const dir = baseDir || process.env.OFFICIAL_DATA_DIR || 'C:/Users/thesh/OneDrive/Documents/CODES/__ROSEBUD-AI-LABRUTE/fichiers_labrute-officiel/labrute/core/src/brute';
    const file = join(dir, 'skills.ts');
    if (!existsSync(file)) return null;
    const src = readFileSync(file, 'utf-8');
    const map: Record<string, SkillData> = {};
    // Very loose parser over `export const skills = [ { name: '...', type: '...', uses: N, toss: N }, ... ]`
    const blockRx = /export\s+const\s+skills\s*=\s*\[([\s\S]*?)\];/m;
    const block = blockRx.exec(src)?.[1] || '';
    const itemRx = /\{[\s\S]*?name:\s*['"]([a-zA-Z0-9_]+)['"][\s\S]*?\}/gm;
    let m: RegExpExecArray | null;
    while ((m = itemRx.exec(block))) {
      const itemStr = m[0];
      const name = m[1];
      const type = /type:\s*['"]([a-zA-Z]+)['"]/m.exec(itemStr)?.[1];
      const uses = /uses:\s*([0-9]+)/m.exec(itemStr)?.[1];
      const toss = /toss:\s*([0-9]+)/m.exec(itemStr)?.[1];
      map[name] = { name, type, uses: uses ? parseInt(uses, 10) : undefined, toss: toss ? parseInt(toss, 10) : undefined };
    }
    return Object.keys(map).length ? map : null;
  } catch {
    return null;
  }
}

export type PetData = {
  name: string;
  hp: number;
  strength: number;
  agility: number;
  speed: number;
  initiative: number;
  accuracy: number;
  evasion: number;
  damage: number;
  reach?: number;
  counter?: number;
  combo?: number;
  block?: number;
  disarm?: number;
  enduranceMalus?: number;
  odds?: number;
};

export function loadOfficialPets(baseDir?: string): Record<string, PetData> | null {
  const jsonPath = resolveDataPath('pets.json');
  if (jsonPath) {
    const arr = readJsonSafe(jsonPath) as any[] | null;
    if (Array.isArray(arr) && arr.length) {
      const out: Record<string, PetData> = {};
      for (const it of arr) out[it.name] = it as PetData;
      return out;
    }
  }
  try {
    const dir = baseDir || process.env.OFFICIAL_DATA_DIR || 'C:/Users/thesh/OneDrive/Documents/CODES/__ROSEBUD-AI-LABRUTE/fichiers_labrute-officiel/labrute/core/src/brute';
    const file = join(dir, 'pets.ts');
    if (!existsSync(file)) return null;
    const src = readFileSync(file, 'utf-8');
    const map: Record<string, PetData> = {};
    // Parse pets: [ { name: PetName.xxx, initiative: N, strength: N, agility: N, speed: N, hp: N, ... }, ... ]
    const blockRx = /export\s+const\s+pets\s*=\s*\[([\s\S]*?)\];/m;
    const block = blockRx.exec(src)?.[1] || '';
    const items = block.split(/\},\s*\{/).map((chunk, i, arr) => {
      if (!chunk.trim()) return '';
      let s = chunk;
      if (i === 0 && !s.startsWith('{')) s = '{' + s;
      if (i === arr.length - 1 && !s.trim().endsWith('}')) s = s + '}';
      return s;
    }).filter(Boolean) as string[];
    for (const item of items) {
      const name = /name:\s*PetName\.([a-zA-Z0-9_]+)/m.exec(item)?.[1];
      if (!name) continue;
      const num = (re: RegExp) => { const mm = re.exec(item)?.[1]; return mm ? parseFloat(mm) : 0; };
      map[name] = {
        name,
        odds: num(/odds:\s*([0-9.\-]+)/m),
        initiative: num(/initiative:\s*([0-9.\-]+)/m),
        strength: num(/strength:\s*([0-9.\-]+)/m),
        agility: num(/agility:\s*([0-9.\-]+)/m),
        speed: num(/speed:\s*([0-9.\-]+)/m),
        hp: num(/hp:\s*([0-9.\-]+)/m),
        counter: num(/counter:\s*([0-9.\-]+)/m),
        combo: num(/combo:\s*([0-9.\-]+)/m),
        block: num(/block:\s*([0-9.\-]+)/m),
        evasion: num(/evasion:\s*([0-9.\-]+)/m),
        accuracy: num(/accuracy:\s*([0-9.\-]+)/m),
        disarm: num(/disarm:\s*([0-9.\-]+)/m),
        damage: num(/damage:\s*([0-9.\-]+)/m),
        reach: num(/reach:\s*([0-9.\-]+)/m),
        enduranceMalus: num(/enduranceMalus:\s*([0-9.\-]+)/m),
      };
    }
    return Object.keys(map).length ? map : null;
  } catch {
    return null;
  }
}
