// MOTEUR DE COMBAT LABRUTE COMPLET POUR SHACKERS
// Contient TOUTES les formules et mécaniques exactes du jeu officiel

export const LABRUTE_CONSTANTS = {
  // Combat
  FIGHTS_PER_DAY: 6,
  NO_WEAPON_TOSS: 10,
  BARE_HANDS_DAMAGE: 5,
  
  // Arène
  ARENA_OPPONENTS_COUNT: 6,
  ARENA_OPPONENTS_MAX_GAP: 2,
  
  // Stats de départ
  BRUTE_STARTING_POINTS: 11,
  
  // Initiative de base
  BASE_TEMPO: 1.2,
  
  // Stats de base des combattants
  BASE_FIGHTER_STATS: {
    reversal: 0,
    evasion: 0.1,
    dexterity: 0.2,
    block: -0.25,
    accuracy: 0,
    disarm: 0.05,
    combo: 0,
    deflect: 0,
    tempo: 1.2,
    criticalChance: 0.05,
    criticalDamage: 1.5,
  }
};

// Calcul exact des HP
export function calculateHP(endurance, level) {
  return 50 + (Math.max(endurance, 0) + level * 0.25) * 6;
}

// Calcul exact de l'initiative
export function calculateInitiative(tempo, agility) {
  return tempo - (agility * 0.01) + Math.random() * 0.2;
}

// Calcul exact des dégâts normaux
export function calculateNormalDamage(base, strength, skillsMultiplier = 1) {
  const randomFactor = 0.8 + Math.random() * 0.4; // 80% - 120%
  return Math.floor(
    (base + strength * (0.2 + base * 0.05)) * randomFactor * skillsMultiplier
  );
}

// Calcul exact des dégâts de lancer
export function calculateThrowDamage(base, strength, agility, skillsMultiplier = 1) {
  const randomFactor = 1 + Math.random() * 0.5; // 100% - 150%
  return Math.floor(
    (base + strength * 0.1 + agility * 0.15) * randomFactor * skillsMultiplier
  );
}

// Calcul exact des dégâts Piledriver
export function calculatePiledriverDamage(opponentStrength, skillsMultiplier = 1) {
  const randomFactor = 0.8 + Math.random() * 0.4; // 80% - 120%
  return Math.floor(
    (10 + opponentStrength * 0.6) * randomFactor * skillsMultiplier * 4
  );
}

// Application de l'armure
export function applyArmor(damage, armor) {
  const finalDamage = Math.ceil(damage * (1 - armor));
  return Math.max(1, finalDamage); // Minimum 1 dégât
}

// Calcul de l'esquive
export function calculateEvasion(agility, weaponEvasion = 0, skillEvasion = 0) {
  return 0.1 + agility * 0.002 + weaponEvasion + skillEvasion;
}

// Calcul du blocage
export function calculateBlock(weaponBlock = 0, skillBlock = 0) {
  return -0.25 + weaponBlock + skillBlock;
}

// Test si une action réussit
export function rollChance(chance) {
  return Math.random() < chance;
}

// Calcul des dégâts critiques
export function applyCritical(damage, criticalChance, criticalDamage) {
  if (rollChance(criticalChance)) {
    return {
      damage: Math.floor(damage * criticalDamage),
      critical: true
    };
  }
  return { damage, critical: false };
}

// Stats des pets
export const PET_STATS = {
  dog: {
    getHP: (level) => 26 + level * 2,
    getDamage: (level) => 5 + level * 2,
    getInitiative: (level) => 0.6 + level * 0.01,
  },
  bear: {
    getHP: (level) => 110 + level * 4,
    getDamage: (level) => 11 + level * 2,
    getInitiative: () => 0.9,
    reduceMasterHP: true, // Réduit les HP du maître de 50%
  },
  panther: {
    getHP: (level) => 26 + level * 2,
    getDamage: (level) => 5 + level * 2,
    getInitiative: (level) => 0.75 + level * 0.01,
    criticalBonus: 0.15,
  }
};

// Skills et leurs effets
export const SKILL_EFFECTS = {
  // Boosters
  herculeanStrength: { strength: 3 },
  felineAgility: { agility: 3 },
  lightningBolt: { speed: 3 },
  vitality: { endurance: 3 },
  immortality: { endurance: 10 },
  
  // Passifs
  weaponsMaster: { weaponDamage: 0.5 },
  martialArts: { bareHandsDamage: 0.5 },
  sixthSense: { evasion: 0.3 },
  hostility: { counter: 0.5 },
  fistsOfFury: { combo: 0.2 },
  shield: { block: 0.45 },
  armor: { armor: 0.25 },
  toughenedSkin: { armor: 0.1 },
  untouchable: { evasion: 0.3 },
  bodybuilder: { strength: 0.5 },
  balletShoes: { agility: 0.5 },
  determination: { endurance: 0.5 },
  ironHead: { hpMultiplier: 1.5 },
  counterAttack: { counter: 0.3 },
  
  // Supers
  fierceBrute: { damageMultiplier: 2, uses: 1 },
  hammer: { damageMultiplier: 4, uses: 1 },
  thief: { uses: 2 },
  net: { uses: 1 },
  bomb: { damage: 50, uses: 1 },
  tragicPotion: { poisonDamage: 0.5, uses: 1 },
};

// Application complète des dégâts avec toutes les mécaniques
export function applyCompleteDamage(attacker, defender, weaponDamage = null) {
  let base = weaponDamage || LABRUTE_CONSTANTS.BARE_HANDS_DAMAGE;
  let skillsMultiplier = 1;
  
  // Ajout des modificateurs de skills
  if (attacker.skills) {
    if (attacker.skills.includes('weaponsMaster') && weaponDamage) {
      skillsMultiplier += 0.5;
    }
    if (attacker.skills.includes('martialArts') && !weaponDamage) {
      skillsMultiplier += 0.5;
    }
    if (attacker.activeSkills?.includes('fierceBrute')) {
      skillsMultiplier *= 2;
    }
  }
  
  // Calcul des dégâts de base
  let damage = calculateNormalDamage(base, attacker.strength, skillsMultiplier);
  
  // Application du critique
  const critResult = applyCritical(
    damage, 
    attacker.criticalChance || 0.05,
    attacker.criticalDamage || 1.5
  );
  damage = critResult.damage;
  
  // Test d'esquive
  const evasionChance = calculateEvasion(
    defender.agility || 0,
    defender.weaponEvasion || 0,
    defender.skillEvasion || 0
  );
  
  if (rollChance(evasionChance)) {
    return { damage: 0, evaded: true, critical: critResult.critical };
  }
  
  // Test de blocage
  const blockChance = calculateBlock(
    defender.weaponBlock || 0,
    defender.skillBlock || 0
  );
  
  if (rollChance(blockChance)) {
    damage = Math.floor(damage * 0.5);
  }
  
  // Application de l'armure
  damage = applyArmor(damage, defender.armor || 0);
  
  return { 
    damage, 
    evaded: false, 
    critical: critResult.critical,
    blocked: blockChance > 0 && rollChance(blockChance)
  };
}

// Gestion des combos
export function checkCombo(fighter, weapon) {
  let comboChance = LABRUTE_CONSTANTS.BASE_FIGHTER_STATS.combo;
  
  if (weapon) {
    comboChance += weapon.combo || 0;
  }
  
  if (fighter.skills?.includes('fistsOfFury')) {
    comboChance += 0.2;
  }
  
  return rollChance(comboChance);
}

// Gestion du reversal
export function checkReversal(defender, weapon) {
  let reversalChance = LABRUTE_CONSTANTS.BASE_FIGHTER_STATS.reversal;
  
  if (weapon) {
    reversalChance += weapon.reversal || 0;
  }
  
  return rollChance(reversalChance);
}

// Gestion du désarmement
export function checkDisarm(attacker, weapon) {
  let disarmChance = LABRUTE_CONSTANTS.BASE_FIGHTER_STATS.disarm;
  
  if (weapon) {
    disarmChance += weapon.disarm || 0;
  }
  
  if (attacker.skills?.includes('sabotage')) {
    disarmChance += 0.5;
  }
  
  return rollChance(disarmChance);
}

// XP requis pour le niveau suivant
export function getXPForNextLevel(level) {
  return level * 5;
}

// Points gagnés par niveau
export function getPointsForLevel(level) {
  if (level <= 2) return 2;
  return 1;
}

// Calcul du tour suivant
export function getNextFighterTurn(fighters) {
  // Le combattant avec l'initiative la plus BASSE joue en premier
  return fighters.reduce((lowest, fighter) => {
    if (!fighter.hp || fighter.hp <= 0) return lowest;
    if (!lowest || fighter.initiative < lowest.initiative) return fighter;
    return lowest;
  }, null);
}

// Export de toutes les formules officielles
export default {
  LABRUTE_CONSTANTS,
  calculateHP,
  calculateInitiative,
  calculateNormalDamage,
  calculateThrowDamage,
  calculatePiledriverDamage,
  applyArmor,
  calculateEvasion,
  calculateBlock,
  rollChance,
  applyCritical,
  applyCompleteDamage,
  checkCombo,
  checkReversal,
  checkDisarm,
  getXPForNextLevel,
  getPointsForLevel,
  getNextFighterTurn,
  PET_STATS,
  SKILL_EFFECTS
};