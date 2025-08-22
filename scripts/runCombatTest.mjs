#!/usr/bin/env node
// Deterministic Combat Engine Test Harness (ESM)
// Usage:
//   node scripts/runCombatTest.mjs --seed="my-seed" --maxTurns=500 --snapshot --output=".snapshots/fights/seed-my-seed.json" [--debug] [--formulas=parity|exact] [--pets] [--petA=panther --petB=bear]
//   npm run test:combat -- --seed=42 --snapshot

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

import { CombatEngine } from '../src/engine/CombatEngine.js';
import { RNG } from '../src/engine/rng.js';
import parityFormulas from '../src/engine/formulas.js';
import labruteFormulas from '../src/engine/formulas.labrute.js';

function parseArgs(argv) {
  const args = {};
  for (const a of argv.slice(2)) {
    if (a.startsWith('--')) {
      const [k, v] = a.replace(/^--/, '').split('=');
      if (v === undefined) {
        args[k] = true;
      } else {
        args[k] = v;
      }
    }
  }
  return args;
}

function buildFighter(name, overrides = {}) {
  const stats = {
    name,
    // Core resources
    maxHealth: overrides.maxHealth ?? 140,
    health: overrides.health ?? (overrides.maxHealth ?? 140),
    maxStamina: overrides.maxStamina ?? 120,
    stamina: overrides.stamina ?? (overrides.maxStamina ?? 120),

    // Primary attributes
    strength: overrides.strength ?? 22,
    defense: overrides.defense ?? 10,
    agility: overrides.agility ?? 12,
    speed: overrides.speed ?? 10,

    // Initiative system
    baseInitiative: overrides.baseInitiative ?? 1.0,

    // Advanced combat modifiers
    combo: overrides.combo ?? 0,
    counter: overrides.counter ?? 0,

    // Skills (ensure deterministic by explicit list)
    skills: Array.isArray(overrides.skills) ? overrides.skills : [],
  };

  return {
    stats,
    hasWeapon: overrides.hasWeapon ?? true,
    weaponType: overrides.weaponType ?? 'spear',
    // Pet assistance can be toggled via CLI flags (deterministic via injected RNG)
    petType: overrides.petType,
  };
}

function serializeStep(step, f1, f2) {
  const safe = {
    turn: step.turn,
    type: step.type,
    attacker: step.attacker?.stats?.name ?? null,
    target: step.target?.stats?.name ?? null,
    hit: step.hit ?? null,
    damage: typeof step.damage === 'number' ? step.damage : null,
    critical: step.critical ?? false,
    combo: step.combo ?? 0,
    message: step.message ?? '',
    dodgedAction: step.dodgedAction ?? null,
    weaponLost: step.weaponLost ?? null,
    specialMove: step.specialMove?.name ?? null,
    // Nested results
    multiAttack: step.multiAttack
      ? {
          type: step.multiAttack.type,
          damage: step.multiAttack.damage,
          message: step.multiAttack.message,
        }
      : null,
    petAssist: step.petAssist
      ? {
          pet: step.petAssist.pet?.name ?? null,
          ability: step.petAssist.ability ?? null,
          damage: step.petAssist.damage ?? null,
          status: step.petAssist.statusEffect?.type ?? null,
        }
      : null,
    // Health/stamina snapshot after step
    state: {
      [f1.stats.name]: {
        hp: f1.stats.health,
        sp: f1.stats.stamina,
      },
      [f2.stats.name]: {
        hp: f2.stats.health,
        sp: f2.stats.stamina,
      },
    },
  };
  return safe;
}

function computeSnapshotHash(obj) {
  const json = JSON.stringify(obj);
  return crypto.createHash('sha256').update(json).digest('hex');
}

async function main() {
  const args = parseArgs(process.argv);
  const seed = args.seed ?? 'seed-001';
  const maxTurns = Number(args.maxTurns ?? 500);
  const snapshot = Boolean(args.snapshot ?? false);
  const defaultOutPath = path.join('.snapshots', 'fights', `seed-${String(seed).replace(/[^a-zA-Z0-9_-]+/g, '_')}.json`);
  let outPath = args.output;
  if (typeof outPath !== 'string' || outPath.length === 0) {
    outPath = defaultOutPath;
  }
  const debug = Boolean(args.debug ?? false);
  const includeDebug = Boolean((args.includeDebug ?? false) || debug);
  const instrumentFormulas = Boolean((args.instrumentFormulas ?? false) || debug);
  const enablePets = Boolean(args.pets || args.enablePets || args.petA || args.petB);
  const formulasMode = (args.formulas === 'exact' || args.formulas === 'labrute' || args.formulas === 'lb') ? 'exact' : 'parity';
  const selectedFormulas = formulasMode === 'exact' ? labruteFormulas : parityFormulas;
  if (debug) {
    console.log(`[Harness] Starting combat test: seed=${seed}, maxTurns=${maxTurns}, snapshot=${snapshot}, out=${outPath}, formulas=${formulasMode}, pets=${enablePets}, petA=${args.petA || 'none'}, petB=${args.petB || 'none'}`);
  }

  // Fighters (fixed baseline for deterministic parity)
  const fighterA = buildFighter('Alpha', {
    strength: 24,
    defense: 9,
    agility: 14,
    speed: 12,
    combo: 1,
    counter: 1,
    weaponType: 'spear',
    petType: enablePets ? (args.petA || 'dog1') : undefined,
  });
  const fighterB = buildFighter('Bravo', {
    strength: 26,
    defense: 8,
    agility: 10,
    speed: 9,
    combo: 0,
    counter: 2,
    weaponType: 'hammer',
    petType: enablePets ? (args.petB || 'dog1') : undefined,
  });

  const rng = new RNG(seed);
  const engine = new CombatEngine(fighterA, fighterB, { rng, formulasAdapter: selectedFormulas, debug, instrumentFormulas });

  const steps = [];
  let turns = 0;
  let result;
  let spin = 0;
  const spinWarnEvery = 5000;
  const spinLimit = 20000;
  while (turns < maxTurns) {
    result = engine.executeTurn();
    if (!result) {
      spin++;
      if (spin % spinWarnEvery === 0 || (debug && spin % 1000 === 0)) {
        console.warn(`No result yet (spin=${spin}) at turn=${engine.currentTurn}. Engine may be mid-resolution...`);
      }
      if (spin > spinLimit) {
        console.error(`Aborting due to excessive null results (spin>${spinLimit}) at turn=${engine.currentTurn}.`);
        break;
      }
      continue; // avoid tight infinite loop
    }
    spin = 0;
    steps.push(serializeStep({ ...result, turn: engine.currentTurn }, fighterA, fighterB));
    if (result.gameOver) break;
    turns++;
  }

  const winner = result?.winner?.stats?.name ?? (fighterA.stats.health > 0 ? fighterA.stats.name : fighterB.stats.name);
  const summary = {
    seed,
    maxTurns,
    totalTurns: turns,
    winner,
    final: {
      [fighterA.stats.name]: {
        hp: fighterA.stats.health,
        sp: fighterA.stats.stamina,
      },
      [fighterB.stats.name]: {
        hp: fighterB.stats.health,
        sp: fighterB.stats.stamina,
      },
    },
    steps,
  };
  if (includeDebug) {
    summary.debug = {
      enabled: debug,
      instrumentFormulas,
      logs: engine.debugLogs,
    };
  }
  // Compute parity hash EXCLUDING debug logs to keep hashes stable regardless of instrumentation
  const parityObject = { ...summary };
  delete parityObject.debug;
  const hash = computeSnapshotHash(parityObject);
  summary.snapshotHash = hash;

  if (snapshot) {
    const dir = path.dirname(outPath);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(summary, null, 2), 'utf-8');
    console.log(`Snapshot written: ${outPath}`);
    console.log(`Snapshot hash: ${hash}`);
  } else {
    console.log(JSON.stringify(summary, null, 2));
  }
}

main().catch((err) => {
  console.error('Harness error:', err);
  process.exit(1);
});
