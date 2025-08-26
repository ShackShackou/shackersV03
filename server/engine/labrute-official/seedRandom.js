/**
 * Simple deterministic RNG based on a linear congruential generator
 * Returns a function compatible with Math.random
 */
function seedRandom(seed) {
  // Convert non-number seeds to a numeric value
  if (typeof seed !== 'number') {
    seed = String(seed)
      .split('')
      .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  }
  let value = seed % 233280;
  return function() {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

module.exports = { seedRandom };
