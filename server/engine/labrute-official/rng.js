// Deterministic RNG based on Mulberry32 PRNG
function xmur3(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}

class RNG {
  constructor(seed = Date.now()) {
    this.setSeed(seed);
  }

  setSeed(seed) {
    let n;
    if (typeof seed === 'string') {
      const hash = xmur3(seed);
      n = hash();
    } else if (typeof seed === 'number') {
      n = seed >>> 0;
    } else {
      n = Date.now() >>> 0;
    }
    if (n === 0) n = 0x9e3779b9;
    this._state = n >>> 0;
  }

  // Return float in [0,1)
  float() {
    let t = (this._state += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    const result = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    this._state = this._state >>> 0;
    return result;
  }

  // Integer in [min, max] inclusive
  int(min, max) {
    if (max < min) [min, max] = [max, min];
    const r = this.float();
    return Math.floor(r * (max - min + 1)) + min;
  }

  // Returns true with probability p (0..1)
  chance(p) {
    if (p <= 0) return false;
    if (p >= 1) return true;
    return this.float() < p;
  }
}

module.exports = { RNG };
