// Seedable RNG utility using rand-seed for deterministic combat simulations
import Rand from 'rand-seed';

export class RNG {
  constructor(seed = Date.now()) {
    this.setSeed(seed);
  }

  setSeed(seed = Date.now()) {
    this.rand = new Rand(seed);
  }

  // Alias used by some consumers expecting rng.random()
  random() {
    return this.rand.next();
  }

  // Float in [0,1)
  float() {
    return this.random();
  }

  // Integer in [min, max] inclusive
  int(min, max) {
    if (max < min) [min, max] = [max, min];
    return Math.floor(this.random() * (max - min + 1)) + min;
  }

  // Returns true with probability p (0..1)
  chance(p) {
    if (p <= 0) return false;
    if (p >= 1) return true;
    return this.random() < p;
  }

  // Add seed generation
  generateCombatSeed(brute1Id, brute2Id, date = Date.now()) {
    this.setSeed(`${brute1Id}-${brute2Id}-${date}`);
  }

  // Add state export/import
  exportState() {
    return this.rand.currentSeed;
  }

  importState(seed) {
    this.setSeed(seed);
  }
}

