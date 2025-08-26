export const SPECIAL_MOVES = {
  berserkerRage: {
    name: 'Berserker Rage',
    description: 'Double damage for 3 turns',
    duration: 3,
    effect: 'damage_boost',
    multiplier: 2,
    unlockChance: 0.15
  },
  defensiveShield: {
    name: 'Defensive Shield',
    description: 'Reduces incoming damage by 50% for 3 turns',
    duration: 3,
    effect: 'defense_boost',
    multiplier: 0.5,
    unlockChance: 0.12
  },
  vampiricStrike: {
    name: 'Vampiric Strike',
    description: 'Next attack heals for 50% of damage dealt',
    duration: 1,
    effect: 'lifesteal',
    multiplier: 0.5,
    unlockChance: 0.10
  },
  adrenalineRush: {
    name: 'Adrenaline Rush',
    description: 'Restores full stamina and increases accuracy',
    duration: 2,
    effect: 'stamina_accuracy',
    multiplier: 1.5,
    unlockChance: 0.08
  },
  lightningReflexes: {
    name: 'Lightning Reflexes',
    description: 'Grants a chance for an extra attack each turn',
    duration: 5,
    effect: 'multi_attack',
    multiplier: 0.3, // 30% chance for an extra hit
    unlockChance: 0.05
  }
};

export function setupSpecialMoves(engine) {
  engine.specialMoves = SPECIAL_MOVES;
  [engine.fighter1, engine.fighter2].forEach(fighter => {
    fighter.specialMoves = { unlocked: [], active: {} };
  });
  engine.calculateInitiative();
}

export function executeSpecialMove(engine, attacker, defender) {
  attacker.stats.stamina -= 40;
  const randomMove = attacker.specialMoves.unlocked[engine.rng.int(0, attacker.specialMoves.unlocked.length - 1)];
  const moveData = engine.specialMoves[randomMove];
  attacker.specialMoves.active[randomMove] = moveData.duration;
  if (randomMove === 'adrenalineRush') {
    attacker.stats.stamina = attacker.stats.maxStamina;
  }
  return {
    type: 'special',
    attacker: attacker,
    target: defender,
    specialMove: moveData,
    message: `${attacker.stats.name} activates ${moveData.name}! ${moveData.description}`
  };
}

export function tryUnlockSpecialMove(engine, fighter) {
  const availableMoves = Object.keys(engine.specialMoves).filter(move =>
    !fighter.specialMoves.unlocked.includes(move)
  );
  if (availableMoves.length === 0) return null;
  for (const moveKey of availableMoves) {
    const move = engine.specialMoves[moveKey];
    if (engine.rng.chance(move.unlockChance)) {
      fighter.specialMoves.unlocked.push(moveKey);
      return move;
    }
  }
  return null;
}

export function processSpecialMoveEffects(engine, fighter) {
  Object.keys(fighter.specialMoves.active).forEach(moveKey => {
    fighter.specialMoves.active[moveKey]--;
    if (fighter.specialMoves.active[moveKey] <= 0) {
      delete fighter.specialMoves.active[moveKey];
    }
  });
}
