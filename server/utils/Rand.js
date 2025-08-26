const RandLib = require('rand-seed').default;

class Rand {
  constructor(seed) {
    this._rand = new RandLib(seed);
  }

  next() {
    return this._rand.next();
  }

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

module.exports = Rand;
