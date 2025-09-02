// Authentic-like fight engine (seeded, numeric StepTypes)

export const StepType = {
  Saboteur: 0,
  Leave: 1,
  Arrive: 2,
  Trash: 3,
  Steal: 4,
  Trap: 5,
  Heal: 6,
  Resist: 7,
  Survive: 8,
  Hit: 9,
  FlashFlood: 10,
  Hammer: 11,
  Poison: 12,
  Bomb: 13,
  Hypnotise: 14,
  Move: 15,
  Eat: 16,
  MoveBack: 17,
  Equip: 18,
  AttemptHit: 19,
  Block: 20,
  Evade: 21,
  Sabotage: 22,
  Disarm: 23,
  Death: 24,
  Throw: 25,
  End: 26,
  Counter: 27,
  SkillActivate: 28,
  SkillExpire: 29,
  Spy: 30,
  Vampirism: 31,
  Haste: 32,
  Treat: 33,
  DropShield: 34,
  Regeneration: 35,
} as const;

export type RNG = () => number;
import { getTempo as tempoFromStats, getAccuracy as accFromStats, getEvasion as evaFromStats, getBlock as blkFromStats, getCounter as ctrFromStats, getCritChance as critFromStats, getCritDamage as critDmgFromStats } from './officialStats';
import { loadOfficialWeapons, WeaponData } from './dataLoader';
const OFFICIAL_WEAPONS: Record<string, WeaponData> | null = loadOfficialWeapons();

export function mulberry32(seed: number): RNG {
  let t = seed >>> 0;
  return function () {
    t += 0x6D2B79F5; t |= 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export interface BruteLike {
  id: string;
  name: string;
  hp: number;
  strength: number;
  agility: number;
  speed: number;
}

export interface EngineFighter extends BruteLike {
  index: number;
  team: 'L'|'R';
  maxHp: number;
  inReach?: boolean;
  weapon?: WeaponData | null;
}

function mapBrute(b: BruteLike, index: number): EngineFighter {
  // Interpret DB 'hp' as endurance-like stat and compute real HP
  const endurance = Math.max(1, b.hp ?? 10);
  const maxHp = 50 + endurance * 6;
  const pick = (n: string) => OFFICIAL_WEAPONS?.[n];
  const weapon = pick('sword') || pick('broadsword') || pick('axe') || null;
  return {
    id: b.id,
    name: b.name,
    hp: maxHp,
    maxHp,
    strength: b.strength,
    agility: b.agility,
    speed: b.speed,
    index,
    team: index === 0 ? 'L' : 'R',
    weapon,
  };
}

// Basic faithful-like stats (to be replaced by full official curves)
function weaponStats(): WeaponData | null {
  const pick = (n: string) => OFFICIAL_WEAPONS?.[n];
  return pick('sword') || pick('broadsword') || pick('axe') || null;
}

function getAccuracy(f: EngineFighter) {
  const base = accFromStats(f.agility);
  const w = weaponStats();
  return Math.max(0, Math.min(0.98, base + (w?.accuracy || 0)));
}
function getEvasion(f: EngineFighter) { return evaFromStats(f.agility); }
function getBlock(f: EngineFighter) { return blkFromStats(f.agility); }
function getCounter(f: EngineFighter) { return ctrFromStats(f.agility); }
function getCritChance(f: EngineFighter) { return critFromStats(f.agility); }
function getCritDamage(_f: EngineFighter) { return critDmgFromStats(); }
function getTempo(f: EngineFighter) {
  const w = weaponStats();
  if (w) return Math.max(0.4, w.tempo);
  return tempoFromStats(f.speed);
}

function getReach(_f: EngineFighter) {
  const w = weaponStats();
  return w?.reach ?? 1;
}

function getDamage(attacker: EngineFighter, defender: EngineFighter, rnd: RNG) {
  // Official-like fists damage formula (no weapons)
  const base = 10;
  let damage = Math.floor((base + attacker.strength * (0.2 + base * 0.05)) * (0.8 + rnd() * 0.4));
  if (damage < 1) damage = 1;
  // Crit
  const crit = rnd() < getCritChance(attacker);
  if (crit) damage = Math.floor(damage * getCritDamage(attacker));
  return { damage, criticalHit: crit };
}

function pickCurrentByInitiative(fighters: EngineFighter[], currentInit: number[]) {
  // Choose index with lowest initiative value
  let best = 0; let bestVal = Number.POSITIVE_INFINITY;
  for (let i = 0; i < fighters.length; i++) {
    if (fighters[i].hp <= 0) continue;
    if (currentInit[i] < bestVal) { bestVal = currentInit[i]; best = i; }
  }
  return best;
}

function advanceInitiatives(init: number[], fighters: EngineFighter[], actedIndex: number) {
  // After an action, the actor increases by its tempo; everyone else slightly decreases to keep order dynamic
  init[actedIndex] += getTempo(fighters[actedIndex]);
  for (let i = 0; i < fighters.length; i++) {
    if (i !== actedIndex) init[i] = Math.max(0, init[i] - 0.05);
  }
  // no return
}

export function generateFight(bruteA: BruteLike, bruteB: BruteLike, seed?: number) {
  const s = (typeof seed === 'number' ? seed >>> 0 : Date.now() >>> 0) || 0x9e3779b9;
  const rnd = mulberry32(s);
  const f0 = mapBrute(bruteA, 0);
  const f1 = mapBrute(bruteB, 1);

  const steps: any[] = [];
  steps.push({ a: StepType.Arrive, f: 0 });
  steps.push({ a: StepType.Arrive, f: 1 });

  // Initiative loop (lower goes first). Initialize with some jitter
  const fighters = [f0, f1];
  const initialFighters = fighters.map((f) => ({ ...f, hp: f.maxHp }));
  const initVals = fighters.map(() => rnd() * 0.2);
  let guard = 400;
  while (guard-- > 0 && f0.hp > 0 && f1.hp > 0) {
    const a = pickCurrentByInitiative(fighters, initVals);
    const t = 1 - a;
    const attacker = fighters[a];
    const defender = fighters[t];

    // Move only if not already in reach (reduce ping-pong)
    if (!attacker.inReach) {
      steps.push({ a: StepType.Move, f: a, t });
      attacker.inReach = true;
    }
    steps.push({ a: StepType.AttemptHit, f: a });

    const accuracy = getAccuracy(attacker);
    const evasion = getEvasion(defender);
    const hitRoll = rnd();
    const evadeRoll = rnd();
    const blockRoll = rnd();
    const hit = hitRoll < accuracy;
    if (hit && evadeRoll < evasion) {
      steps.push({ a: StepType.Evade, f: t });
      steps.push({ a: StepType.MoveBack, f: a });
      attacker.inReach = false;
      advanceInitiatives(initVals, fighters, a);
      continue;
    }

    if (hit && blockRoll < getBlock(defender)) {
      steps.push({ a: StepType.Block, f: t });
      if (rnd() < getCounter(defender)) {
        steps.push({ a: StepType.Counter, f: t, t: a });
        const { damage, criticalHit } = getDamage(defender, attacker, rnd);
        attacker.hp = Math.max(0, attacker.hp - damage);
        const cstep: any = { a: StepType.Hit, f: t, t: a, d: damage };
        if (criticalHit) cstep.c = 1;
        steps.push(cstep);
        if (attacker.hp <= 0) { steps.push({ a: StepType.Death, f: a }); steps.push({ a: StepType.End, w: t, l: a }); break; }
      }
      steps.push({ a: StepType.MoveBack, f: a });
      attacker.inReach = false;
      advanceInitiatives(initVals, fighters, a);
      continue;
    }

    if (hit) {
      const { damage, criticalHit } = getDamage(attacker, defender, rnd);
      defender.hp = Math.max(0, defender.hp - damage);
      const step: any = { a: StepType.Hit, f: a, t, d: damage };
      if (criticalHit) step.c = 1;
      steps.push(step);
      if (defender.hp <= 0) { steps.push({ a: StepType.Death, f: t }); steps.push({ a: StepType.End, w: a, l: t }); break; }
      steps.push({ a: StepType.MoveBack, f: a });
      attacker.inReach = false;
    }
    advanceInitiatives(initVals, fighters, a);
  }

  // Return initial fighters (full HP) so UI starts from max bars and expose minimal reach
  const fightersForClient = initialFighters.map((f) => ({
    id: f.id,
    name: f.name,
    hp: f.maxHp,
    maxHp: f.maxHp,
    strength: f.strength,
    agility: f.agility,
    speed: f.speed,
    index: f.index,
    team: f.team,
    reach: getReach(f),
  }));
  return { fight: { fighters: fightersForClient }, steps, seed: s };
}






