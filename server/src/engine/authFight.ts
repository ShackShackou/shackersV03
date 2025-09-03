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
import { loadOfficialWeapons, loadOfficialSkills, loadOfficialPets, WeaponData, SkillData, PetData } from './dataLoader';
const OFFICIAL_WEAPONS: Record<string, WeaponData> | null = loadOfficialWeapons();
const OFFICIAL_SKILLS: Record<string, SkillData> | null = loadOfficialSkills();
const OFFICIAL_PETS: Record<string, PetData> | null = loadOfficialPets();

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
  trappedTurns?: number;
  stunnedTurns?: number;
  hypnotizedTurns?: number;
  lifestealNext?: number; // fraction to heal on next hit
  hasteTurns?: number; // reduce tempo
  fierceTurns?: number; // double damage
  piledriverTurns?: number; // x4 damage
  tragicTurns?: number; // x1.5 damage
  superUses?: Record<string, number>;
  isPet?: boolean;
  master?: number;
  eaten?: boolean; // for pets consumed by Tamer
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
    superUses: {},
  };
}

// Basic faithful-like stats (to be replaced by full official curves)
function weaponStats(): WeaponData | null {
  const pick = (n: string) => OFFICIAL_WEAPONS?.[n];
  // Prefer sharp/long middleground weapons if present
  return pick('broadsword') || pick('sword') || pick('baton') || pick('axe') || null;
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
  let base = w ? Math.max(0.4, w.tempo) : tempoFromStats(f.speed);
  if (f.hasteTurns && f.hasteTurns > 0) base = Math.max(0.3, base * 0.7);
  return base;
}

function getReach(_f: EngineFighter) {
  const w = weaponStats();
  return w?.reach ?? 1;
}

// Provide a suggested delay (ms) per step, based on fighter tempo
function dtFor(f: EngineFighter, action: number): number {
  const t = Math.max(0.3, getTempo(f)); // lower = faster
  const base = (() => {
    switch (action) {
      case StepType.Move: return 300;
      case StepType.MoveBack: return 260;
      case StepType.AttemptHit: return 220;
      case StepType.Hit: return 200;
      case StepType.Block: return 140;
      case StepType.Evade: return 140;
      case StepType.Counter: return 160;
      case StepType.Hammer: return 180;
      case StepType.FlashFlood: return 120;
      case StepType.Trap: return 180;
      case StepType.Hypnotise: return 200;
      case StepType.Disarm: return 160;
      case StepType.Treat: return 180;
      case StepType.Heal: return 160;
      case StepType.Bomb: return 200;
      case StepType.Equip: return 120;
      default: return 100;
    }
  })();
  return Math.max(60, Math.round(base * t));
}

type SuperName = 'fierceBrute' | 'hammer' | 'tragicPotion' | 'net' | 'hypnosis' | 'vampirism' | 'haste' | 'treat' | 'bomb' | 'flashFlood' | 'thief' | 'tamer' | 'cryOfTheDamned';

function getSkillToss(name: SuperName): number {
  const s = OFFICIAL_SKILLS?.[name];
  if (s?.toss) return s.toss;
  // fallback defaults roughly approximated
  switch (name) {
    case 'fierceBrute': return 5; case 'hammer': return 3; case 'tragicPotion': return 4;
    case 'net': return 4; case 'hypnosis': return 2; case 'vampirism': return 3; case 'haste': return 3; case 'treat': return 5; case 'bomb': return 1; case 'flashFlood': return 2; case 'thief': return 3; case 'cryOfTheDamned': return 2;
    default: return 0;
  }
}

function getSkillUses(name: SuperName): number | undefined {
  const u = OFFICIAL_SKILLS?.[name]?.uses;
  return u ?? undefined;
}

function pickWeighted(rnd: RNG, items: { name: SuperName, weight: number }[], noSuperWeight = 10): SuperName | null {
  const sum = items.reduce((a, it) => a + it.weight, noSuperWeight);
  let roll = Math.floor(rnd() * sum);
  if (roll < noSuperWeight) return null;
  roll -= noSuperWeight;
  for (const it of items) {
    if (roll < it.weight) return it.name;
    roll -= it.weight;
  }
  return null;
}

function hashString32(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  return h >>> 0;
}

function getDamage(attacker: EngineFighter, defender: EngineFighter, rnd: RNG) {
  // Official-like fists damage formula (no weapons)
  const base = 10;
  let damage = Math.floor((base + attacker.strength * (0.2 + base * 0.05)) * (0.8 + rnd() * 0.4));
  if (damage < 1) damage = 1;
  // Crit
  const crit = rnd() < getCritChance(attacker);
  if (crit) damage = Math.floor(damage * getCritDamage(attacker));
  // Apply active multipliers
  let mult = 1;
  if (attacker.fierceTurns && attacker.fierceTurns > 0) mult *= 2;
  if (attacker.piledriverTurns && attacker.piledriverTurns > 0) mult *= 4;
  if (attacker.tragicTurns && attacker.tragicTurns > 0) mult *= 1.5;
  if (mult !== 1) damage = Math.floor(damage * mult);
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

function pickOpponentIndex(attacker: EngineFighter, fighters: EngineFighter[], rnd: RNG): number {
  // Prefer primary brute of opposite team: index 1 if attacker is team L, else 0
  const preferred = attacker.team === 'L' ? 1 : 0;
  if (fighters[preferred] && fighters[preferred].team !== attacker.team && fighters[preferred].hp > 0) {
    return preferred;
  }
  // Otherwise pick first alive opponent, or random among them
  const opponents = fighters
    .map((f, i) => ({ f, i }))
    .filter((x) => x.f.team !== attacker.team && x.f.hp > 0);
  if (opponents.length === 0) return preferred;
  const pick = opponents[Math.floor(rnd() * opponents.length)];
  return pick?.i ?? preferred;
}

export function generateFight(bruteA: BruteLike, bruteB: BruteLike, seed?: number) {
  const s = (typeof seed === 'number' ? seed >>> 0 : Date.now() >>> 0) || 0x9e3779b9;
  const rnd = mulberry32(s);
  const f0 = mapBrute(bruteA, 0);
  const f1 = mapBrute(bruteB, 1);

  const steps: any[] = [];
  steps.push({ a: StepType.Arrive, f: 0, dt: 120 });
  steps.push({ a: StepType.Arrive, f: 1, dt: 120 });
  // Initial weapon equip (visual)
  if (f0.weapon) steps.push({ a: StepType.Equip, b: 0, dt: dtFor(f0, StepType.Equip) });
  if (f1.weapon) steps.push({ a: StepType.Equip, b: 1, dt: dtFor(f1, StepType.Equip) });

  // Build fighters list and spawn pets deterministically per brute (placeholder entities)
  const fighters: EngineFighter[] = [f0, f1];
  const weightedPetName = () => {
    const entries = OFFICIAL_PETS ? Object.values(OFFICIAL_PETS) : [];
    if (!entries.length) return 'dog2';
    const total = entries.reduce((a, e) => a + (e.odds || 1), 0);
    let roll = rnd() * total;
    for (const e of entries) { roll -= (e.odds || 1); if (roll <= 0) return e.name; }
    return entries[0].name;
  };
  const spawnPet = (team: 'L'|'R', masterIndex: number, name?: string) => {
    const petName = weightedPetName();
    const chosen = name || petName;
    const p = OFFICIAL_PETS?.[chosen];
    const baseHp = Math.max(10, Math.floor((p?.hp ?? 14)));
    const pet: EngineFighter = {
      id: `${team}-pet-${fighters.length}`,
      name: chosen,
      hp: baseHp,
      maxHp: baseHp,
      strength: p?.strength ?? 6,
      agility: p?.agility ?? 5,
      speed: p?.speed ?? 6,
      index: fighters.length,
      team,
      weapon: null,
      superUses: {},
      isPet: true,
      master: masterIndex,
      eaten: false,
    };
    fighters.push(pet);
    steps.push({ a: StepType.Arrive, f: pet.index, dt: 120 });
  };
  // Deterministic per-brute pets using derived RNG per brute
  const petForBrute = (b: EngineFighter) => {
    const local = mulberry32((s ^ hashString32(b.id)) >>> 0);
    const chance = local(); // 0..1
    if (chance < 0.45) {
      // pick name with local RNG over OFFICIAL_PETS odds
      const entries = OFFICIAL_PETS ? Object.values(OFFICIAL_PETS) : [];
      if (!entries.length) return undefined;
      const total = entries.reduce((a, e) => a + (e.odds || 1), 0);
      let roll = local() * total;
      for (const e of entries) { roll -= (e.odds || 1); if (roll <= 0) return e.name; }
      return entries[0].name;
    }
    return undefined;
  };
  const p0 = petForBrute(f0); if (p0) spawnPet('L', 0, p0);
  const p1 = petForBrute(f1); if (p1) spawnPet('R', 1, p1);

  const initialFighters = fighters.map((f) => ({ ...f, hp: f.maxHp }));
  // Initiative loop (lower goes first). Initialize with some jitter
  const initVals = fighters.map(() => rnd() * 0.2);
  let guard = 400;
  while (guard-- > 0 && f0.hp > 0 && f1.hp > 0) {
    const a = pickCurrentByInitiative(fighters, initVals);
    const attacker = fighters[a];
    const t = pickOpponentIndex(attacker, fighters, rnd);
    const defender = fighters[t];

    // Skip turns for control effects
    if ((attacker.stunnedTurns && attacker.stunnedTurns > 0) || (attacker.trappedTurns && attacker.trappedTurns > 0)) {
      // Expire one turn
      if (attacker.stunnedTurns && attacker.stunnedTurns > 0) attacker.stunnedTurns--;
      if (attacker.trappedTurns && attacker.trappedTurns > 0) attacker.trappedTurns--;
      steps.push({ a: StepType.SkillExpire, b: a });
      advanceInitiatives(initVals, fighters, a);
      continue;
    }

    // Pre-action: pick one super using official-like toss/uses and contextual filters
    const candidates: { name: SuperName, weight: number }[] = [];
    const pushIf = (name: SuperName, cond = true) => {
      if (!cond) return;
      const usesLeft = attacker.superUses?.[name] ?? getSkillUses(name);
      if (typeof usesLeft === 'number' && usesLeft <= 0) return;
      candidates.push({ name, weight: getSkillToss(name) });
    };
    // Context filters (very simplified approximations)
    pushIf('haste', !attacker.hasteTurns);
    pushIf('vampirism', !attacker.lifestealNext && attacker.hp < attacker.maxHp * 0.7);
    pushIf('fierceBrute', !attacker.fierceTurns);
    pushIf('hammer', !attacker.piledriverTurns);
    pushIf('tragicPotion', !attacker.tragicTurns && attacker.hp < attacker.maxHp * 0.5);
    pushIf('net', !defender.trappedTurns);
    pushIf('hypnosis', !defender.hypnotizedTurns);
    pushIf('thief', !!defender.weapon);
    pushIf('bomb', true);
    // Only allow flashFlood when we conceptually have a weapon
    pushIf('flashFlood', !!(attacker.weapon));
    pushIf('treat', attacker.hp < attacker.maxHp * 0.4);
    // Tamer kept minimal here (without pet entities). Only when very low HP
    pushIf('tamer', attacker.hp < attacker.maxHp * 0.35);
    // Cry of the Damned: prefer when target is not stunned
    pushIf('cryOfTheDamned', !defender.hypnotizedTurns);

    const chosen = pickWeighted(rnd, candidates, 12);
    if (chosen) {
      // decrement uses if limited
      const cur = attacker.superUses?.[chosen] ?? getSkillUses(chosen);
      if (typeof cur === 'number') {
        attacker.superUses = attacker.superUses || {};
        attacker.superUses[chosen] = cur - 1;
      }
      switch (chosen) {
        case 'haste': attacker.hasteTurns = 3; steps.push({ a: StepType.Haste, f: a }); break;
        case 'vampirism': attacker.lifestealNext = 0.5; steps.push({ a: StepType.Vampirism, f: a }); break;
        case 'fierceBrute': attacker.fierceTurns = 1; steps.push({ a: StepType.SkillActivate, f: a }); break;
        case 'hammer': attacker.piledriverTurns = 1; steps.push({ a: StepType.Hammer, f: a }); break;
        case 'tragicPotion': {
          const selfDmg = Math.max(1, Math.floor(attacker.maxHp * 0.1));
          attacker.hp = Math.max(1, attacker.hp - selfDmg);
          attacker.tragicTurns = 2; steps.push({ a: StepType.SkillActivate, f: a });
          break;
        }
        case 'net': defender.trappedTurns = 2; steps.push({ a: StepType.Trap, b: a, t }); steps.push({ a: StepType.MoveBack, f: a }); attacker.inReach = false; break;
        case 'hypnosis': {
          defender.hypnotizedTurns = 1; steps.push({ a: StepType.Hypnotise, b: a, t });
          // Also attempt to hypnotize one opponent pet if present
          const oppPets = fighters.filter((f) => f.team !== attacker.team && f.index !== t && f.hp > 0 && f.name && /dog|bear|panther/i.test(f.name));
          if (oppPets.length) {
            const pet = oppPets[Math.floor(rnd() * oppPets.length)];
            pet.stunnedTurns = 1; steps.push({ a: StepType.Hypnotise, b: a, t: pet.index });
          }
          steps.push({ a: StepType.MoveBack, f: a }); attacker.inReach = false; break;
        }
        case 'thief': if (defender.weapon) { defender.weapon = null; steps.push({ a: StepType.Disarm, f: a, t }); steps.push({ a: StepType.MoveBack, f: a }); attacker.inReach = false; } break;
        case 'bomb': {
          const d0 = Math.floor(5 + rnd() * 8);
          const d1 = Math.floor(5 + rnd() * 8);
          // apply to opposing fighter only
          if (a === 0) { f1.hp = Math.max(0, f1.hp - d1); } else { f0.hp = Math.max(0, f0.hp - d0); }
          const d: any = {}; d[0] = (a === 0) ? 0 : d0; d[1] = (a === 1) ? 0 : d1;
          steps.push({ a: StepType.Bomb, f: a, t: [0,1], d });
          if (f0.hp <= 0 || f1.hp <= 0) {
            const winner = f0.hp <= 0 ? 1 : 0; const loser = 1 - winner;
            steps.push({ a: StepType.Death, f: loser }); steps.push({ a: StepType.End, w: winner, l: loser });
            guard = 0; // force exit
          }
          break;
        }
        case 'cryOfTheDamned': {
          // Prefer targeting an opponent pet if alive
          const oppPets = fighters.filter((f) => f.team !== attacker.team && f.hp > 0 && f.isPet);
          if (oppPets.length) {
            const pet = oppPets[Math.floor(rnd() * oppPets.length)];
            const { damage } = getDamage(attacker, pet, rnd);
            const dd = Math.max(1, Math.floor(damage * 1.35));
            pet.hp = Math.max(0, pet.hp - dd);
            steps.push({ a: StepType.Hit, f: a, t: pet.index, d: dd });
            if (pet.hp <= 0) { steps.push({ a: StepType.Death, f: pet.index }); }
          } else {
            const { damage } = getDamage(attacker, defender, rnd);
            const dd = Math.max(1, Math.floor(damage * 1.25));
            defender.hp = Math.max(0, defender.hp - dd);
            steps.push({ a: StepType.Hit, f: a, t, d: dd });
            if (defender.hp <= 0 && (t === 0 || t === 1)) { steps.push({ a: StepType.Death, f: t }); steps.push({ a: StepType.End, w: a, l: t }); guard = 0; }
          }
          steps.push({ a: StepType.MoveBack, f: a }); attacker.inReach = false;
          break;
        }
        case 'flashFlood': /* handled inside hit branch via usedSpecial */ break;
        case 'treat': {
          const heal = Math.min(attacker.maxHp - attacker.hp, Math.floor(attacker.maxHp * 0.2));
          if (heal > 0) { attacker.hp += heal; steps.push({ a: StepType.Treat, f: a, h: heal }); }
          break;
        }
        case 'tamer': {
          // Official-like: eat a dead pet to heal (choose any dead pet)
          const candidates = fighters.filter((f) => f.hp <= 0 && !f.eaten && f.name && /dog|bear|panther/i.test(f.name));
          if (!candidates.length) break;
          const pet = candidates[Math.floor(rnd() * candidates.length)];
          // Determine heal % based on pet
          const pct = /dog/i.test(pet.name) ? 0.2 : (/panther/i.test(pet.name) ? 0.3 : 0.5);
          const heal = Math.min(attacker.maxHp - attacker.hp, Math.floor(attacker.maxHp * pct));
          if (heal > 0) {
            attacker.hp += heal;
            pet.eaten = true;
            steps.push({ a: StepType.Move, f: a, t: pet.index, s: 1 });
            steps.push({ a: StepType.Eat, b: a, t: pet.index, h: heal });
            steps.push({ a: StepType.MoveBack, f: a });
          }
          break;
        }
        default: break;
      }
      if (guard <= 0) break; // in case bomb ended the fight
    }
    // Trap (net): trap the defender (skip their next 1-2 turns)
    if (!defender.trappedTurns && rnd() < 0.02) {
      defender.trappedTurns = 2;
      steps.push({ a: StepType.Trap, b: a, t, dt: dtFor(attacker, StepType.Trap) });
    }
    // Hypnosis: brief stun/hypnotize effect
    if (!defender.hypnotizedTurns && rnd() < 0.01) {
      defender.hypnotizedTurns = 1;
      steps.push({ a: StepType.Hypnotise, b: a, t, dt: dtFor(attacker, StepType.Hypnotise) });
    }
    // Thief (disarm): remove opponent weapon
    if (defender.weapon && rnd() < 0.02) {
      defender.weapon = null;
      steps.push({ a: StepType.Disarm, f: a, t, dt: dtFor(attacker, StepType.Disarm) });
    }
    // Treat: heal self when low HP
    if (attacker.hp > 0 && attacker.hp < attacker.maxHp * 0.4 && rnd() < 0.04) {
      const heal = Math.min(attacker.maxHp - attacker.hp, Math.floor(attacker.maxHp * 0.2));
      if (heal > 0) {
        attacker.hp += heal;
      steps.push({ a: StepType.Treat, f: a, h: heal, dt: dtFor(attacker, StepType.Treat) });
      }
    }
    // Bomb: small AoE damage both
    if (rnd() < 0.008) {
      const d0 = Math.floor(5 + rnd() * 8);
      const d1 = Math.floor(5 + rnd() * 8);
      f0.hp = Math.max(0, f0.hp - (a === 0 ? 0 : d0));
      f1.hp = Math.max(0, f1.hp - (a === 1 ? 0 : d1));
      const d: any = {};
      d[0] = (a === 0) ? 0 : d0;
      d[1] = (a === 1) ? 0 : d1;
      steps.push({ a: StepType.Bomb, f: a, t: [0,1], d });
      if (f0.hp <= 0 || f1.hp <= 0) {
        const winner = f0.hp <= 0 ? 1 : 0;
        const loser = 1 - winner;
        steps.push({ a: StepType.Death, f: loser });
        steps.push({ a: StepType.End, w: winner, l: loser });
        break;
      }
    }

    // Move / reposition based on reach
    const attReach = getReach(attacker);
    const defReach = getReach(defender);
    if (!attacker.inReach) {
      steps.push({ a: StepType.Move, f: a, t, dt: dtFor(attacker, StepType.Move) });
      attacker.inReach = true;
    } else if (attReach < defReach && rnd() < 0.5) {
      // Melee reposition when outranged
      steps.push({ a: StepType.Move, f: a, t, r: 1, dt: dtFor(attacker, StepType.Move) });
    }
    steps.push({ a: StepType.AttemptHit, f: a, dt: dtFor(attacker, StepType.AttemptHit) });

    const accuracy = getAccuracy(attacker);
    const evasion = getEvasion(defender);
    const hitRoll = rnd();
    const evadeRoll = rnd();
    const blockRoll = rnd();
    const hit = hitRoll < accuracy;
    if (hit && evadeRoll < evasion) {
      steps.push({ a: StepType.Evade, f: t, dt: dtFor(defender, StepType.Evade) });
      steps.push({ a: StepType.MoveBack, f: a, dt: dtFor(attacker, StepType.MoveBack) });
      attacker.inReach = false;
      advanceInitiatives(initVals, fighters, a);
      continue;
    }

    if (hit && blockRoll < getBlock(defender)) {
      steps.push({ a: StepType.Block, f: t, dt: dtFor(defender, StepType.Block) });
      if (rnd() < getCounter(defender)) {
        steps.push({ a: StepType.Counter, f: t, t: a, dt: dtFor(defender, StepType.Counter) });
        const { damage, criticalHit } = getDamage(defender, attacker, rnd);
        attacker.hp = Math.max(0, attacker.hp - damage);
        const cstep: any = { a: StepType.Hit, f: t, t: a, d: damage, dt: dtFor(defender, StepType.Hit) };
        if (criticalHit) cstep.c = 1;
        steps.push(cstep);
        if (attacker.hp <= 0) {
          steps.push({ a: StepType.Death, f: a });
          // Only end the fight if a brute died (index 0 or 1)
          if (a === 0 || a === 1) { steps.push({ a: StepType.End, w: t, l: a }); break; }
        }
      }
      steps.push({ a: StepType.MoveBack, f: a, dt: dtFor(attacker, StepType.MoveBack) });
      attacker.inReach = false;
      advanceInitiatives(initVals, fighters, a);
      continue;
    }

    if (hit) {
      // Chance to use FlashFlood as a special multi-hit instead of a regular hit
      let usedSpecial = false;
      if (rnd() < 0.02) {
        usedSpecial = true;
        const hits = 3;
        for (let i = 0; i < hits; i++) {
          const { damage } = getDamage(attacker, defender, rnd);
          const flashDmg = Math.max(1, Math.floor(damage * 0.6));
          defender.hp = Math.max(0, defender.hp - flashDmg);
          steps.push({ a: StepType.FlashFlood, f: a, t, d: flashDmg, dt: dtFor(attacker, StepType.FlashFlood) });
          // Vampirism heal per hit
          if (attacker.lifestealNext && attacker.lifestealNext > 0) {
            const heal = Math.floor(flashDmg * attacker.lifestealNext);
            if (heal > 0) {
              attacker.hp = Math.min(attacker.maxHp, attacker.hp + heal);
              steps.push({ a: StepType.Heal, b: a, h: heal });
            }
          }
          if (defender.hp <= 0) { break; }
        }
        // If lifesteal was set, consume it after the sequence
        if (attacker.lifestealNext && attacker.lifestealNext > 0) attacker.lifestealNext = 0;
        // Return to base after special
        steps.push({ a: StepType.MoveBack, f: a });
        attacker.inReach = false;
      }

      if (!usedSpecial) {
        const { damage, criticalHit } = getDamage(attacker, defender, rnd);
        defender.hp = Math.max(0, defender.hp - damage);
        const step: any = { a: StepType.Hit, f: a, t, d: damage, dt: dtFor(attacker, StepType.Hit) };
        if (criticalHit) step.c = 1;
        steps.push(step);
        // Vampirism heal if active
        if (attacker.lifestealNext && attacker.lifestealNext > 0) {
          const heal = Math.floor(damage * attacker.lifestealNext);
          if (heal > 0) {
            attacker.hp = Math.min(attacker.maxHp, attacker.hp + heal);
            steps.push({ a: StepType.Heal, b: a, h: heal });
          }
          attacker.lifestealNext = 0;
        }
      }

      // Decrement timed buffs
      if (attacker.fierceTurns && --attacker.fierceTurns <= 0) steps.push({ a: StepType.SkillExpire, b: a });
      if (attacker.piledriverTurns && --attacker.piledriverTurns <= 0) steps.push({ a: StepType.SkillExpire, b: a });
      if (attacker.tragicTurns && --attacker.tragicTurns <= 0) steps.push({ a: StepType.SkillExpire, b: a });
      if (defender.hp <= 0) {
        steps.push({ a: StepType.Death, f: t });
        if (t === 0 || t === 1) { steps.push({ a: StepType.End, w: a, l: t }); break; }
      }
      steps.push({ a: StepType.MoveBack, f: a, dt: dtFor(attacker, StepType.MoveBack) });
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






