import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export type WeaponData = {
  name: string;
  tempo: number;
  accuracy: number;
  criticalDamage: number;
  damage: number;
  reach: number;
};

export function loadOfficialWeapons(baseDir?: string): Record<string, WeaponData> | null {
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

