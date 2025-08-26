// LaBrute Exact Formulas Adapter (initial parity)
// This adapter currently re-exports the existing parity formulas.
// It provides a stable import path to progressively implement exact LaBrute mechanics
// without touching callers.

export {
  computeInitiative,
  computeCounterChance,
  computeCounterDamage,
  computeBlockChance,
  computeBlockDamage,
  computeDodgeChance,
  computeAccuracy,
  computeBaseDamage,
  computeDamageVariation,
  computeCritChance,
  computeCritDamageMultiplier,
  computeComboChance,
  computeMaxCombo,
} from './formulas.js';

import base from './formulas.js';

const adapter = {
  ...base,
  // Marker useful for debugging/logging
  __mode: 'labrute-exact',
};

export default adapter;
