import Rand from 'rand-seed';

// Wrapper around `rand-seed` providing utility helpers used by the engine.
export class RNG {
  constructor(seed = Date.now()) {
    this.setSeed(seed);
  }

  setSeed(seed) {
    this.rand = new Rand(seed);
  }

  // Core random method returning a float in [0,1)
  next() {
    return this.rand.next();
  }

  // Legacy helpers built on top of `next()`
  float() {
    return this.next();
  }

  int(min, max) {
    if (max < min) [min, max] = [max, min];
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  chance(p) {
    if (p <= 0) return false;
    if (p >= 1) return true;
    return this.next() < p;
  }
}
