/**
 * OFFICIAL LABRUTE HIT RESOLUTION
 * Implements accuracy, evasion, block and counter formulas
 */

const { getFighterStat } = require('./getFighterStat');

/**
 * Attempt to hit an opponent using official formulas
 * @param {Object} fighter - attacking fighter
 * @param {Object} opponent - defending fighter
 * @returns {Object} result with flags: hit, evaded, blocked, counter
 */
function attemptHit(fighter, opponent) {
  // Accuracy check
  const accuracy = getFighterStat(fighter, 'ACCURACY');
  if (Math.random() >= accuracy) {
    return { hit: false };
  }

  // Evasion check
  const evadeChance = getFighterStat(opponent, 'EVASION');
  if (Math.random() < evadeChance) {
    return { hit: false, evaded: true };
  }

  // Block check (official cap at 40%)
  const blockChance = Math.min(getFighterStat(opponent, 'BLOCK'), 0.4);
  if (Math.random() < blockChance) {
    return { hit: false, blocked: true };
  }

  // Counter check
  const counterChance = getFighterStat(opponent, 'COUNTER');
  if (counterChance && Math.random() < counterChance) {
    return { hit: false, counter: true };
  }

  // Successful hit
  return { hit: true };
}

module.exports = { attemptHit };
