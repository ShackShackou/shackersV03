// Minimal faithful-like stats helpers (to be extended with real data tables)

export interface StatsInput {
  strength: number;
  agility: number;
  speed: number;
}

export const BASE_FIGHTER_STATS = {
  accuracy: 0,
  block: 0,
  evasion: 0,
  critical: 0,
  criticalDamage: 2.0,
  tempo: 1.2,
};

export function getTempo(speed: number) {
  // Lower is faster; clamp like official base
  return Math.max(0.6, BASE_FIGHTER_STATS.tempo - speed * 0.02);
}

export function getAccuracy(agi: number) {
  // Approx faithful curve until full tables exist
  return Math.min(0.75 + agi * 0.005, 0.92);
}

export function getEvasion(agi: number) {
  return Math.min(0.05 + agi * 0.003, 0.25);
}

export function getBlock(agi: number) {
  return Math.min(0.05 + agi * 0.002, 0.20);
}

export function getCounter(agi: number) {
  return Math.min(0.08 + agi * 0.002, 0.20);
}

export function getCritChance(agi: number) {
  return Math.min(0.15 + agi * 0.002, 0.35);
}

export function getCritDamage() {
  return BASE_FIGHTER_STATS.criticalDamage;
}

