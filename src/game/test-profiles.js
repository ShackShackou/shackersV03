// ================================================
// PROFILS DE TEST ÉQUILIBRÉS POUR LABRUTE
// ================================================
// Ces profils respectent les formules officielles et sont équilibrés
// pour avoir environ 50% de chances de victoire les uns contre les autres

export const TEST_PROFILES = {
  // TANK : Très résistant mais lent
  tank: {
    name: "Brutus",
    level: 10,
    stats: {
      name: "Brutus",
      health: 150,
      maxHealth: 150,
      strength: 18,
      agility: 8,
      speed: 10,
      endurance: 15
    },
    skills: [
      "armor",      // -50% dégâts reçus
      "survival",   // Survit à 1 HP une fois
      "resistant"   // Max 20% HP perdus par coup
    ],
    weapons: ["stoneHammer"],  // 20 damage, lent mais puissant
    pet: "bear",          // 100 HP, 35 damage, réduit HP du maître de 50%
    spineModel: "spineboy" // Utilise le modèle Spine par défaut
  },

  // ASSASSIN : Rapide et esquive beaucoup
  assassin: {
    name: "Shadow",
    level: 10,
    stats: {
      name: "Shadow", 
      health: 90,
      maxHealth: 90,
      strength: 8,
      agility: 18,
      speed: 15,
      endurance: 8
    },
    skills: [
      "felineAgility",  // Agilité +50% et +3
      "counterAttack",  // 100% contre après parade
      "untouchable"     // Esquive +30%
    ],
    weapons: ["knife"],   // 71 damage, très rapide (interval 60)
    pet: "panther",       // 50 HP, 30 damage, +15% critique
    spineModel: "raptor"  // Utilise le modèle raptor pour différencier
  },

  // POLYVALENT : Équilibré dans tous les domaines
  polyvalent: {
    name: "Rex",
    level: 10,
    stats: {
      name: "Rex",
      health: 110,
      maxHealth: 110,
      strength: 12,
      agility: 12,
      speed: 12,
      endurance: 12
    },
    skills: [
      "shield",         // Parade +15%
      "regeneration",   // +2 HP par tour
      "accurateStrike"  // Précision +20%
    ],
    weapons: ["sword"],  // 10 damage, équilibré (normal speed)
    pet: "dog",          // 30 HP, 25 damage, fidèle
    spineModel: "spineboy"
  },

  // BERSERKER : Dégâts massifs mais fragile
  berserker: {
    name: "Rage",
    level: 10,
    stats: {
      name: "Rage",
      health: 80,
      maxHealth: 80,
      strength: 22,
      agility: 6,
      speed: 14,
      endurance: 6
    },
    skills: [
      "herculeanStrength",  // Force +50% et +3
      "fierce",            // Critique +30%
      "masterOfArms"       // Dégâts +30% avec armes
    ],
    weapons: ["axe"],    // 55 damage, lent mais devastating
    pet: null,           // Pas de pet (plus de points dans stats)
    spineModel: "raptor" // Modèle différent
  }
};

// ================================================
// GÉNÉRATEUR DE PROFILS ALÉATOIRES
// ================================================

export class ProfileGenerator {
  constructor() {
    this.profileTypes = Object.keys(TEST_PROFILES);
  }

  /**
   * Génère un profil aléatoire parmi les 4 types
   */
  getRandomProfile() {
    const randomType = this.profileTypes[Math.floor(Math.random() * this.profileTypes.length)];
    return this.getProfile(randomType);
  }

  /**
   * Récupère un profil spécifique avec une copie profonde
   */
  getProfile(type) {
    if (!TEST_PROFILES[type]) {
      console.warn(`Profile type "${type}" not found, using tank`);
      type = 'tank';
    }

    // Copie profonde pour éviter les modifications du profil original
    return JSON.parse(JSON.stringify(TEST_PROFILES[type]));
  }

  /**
   * Génère deux profils équilibrés pour un combat
   */
  getBalancedMatchup() {
    // Paires équilibrées selon les tests
    const balancedPairs = [
      ['tank', 'assassin'],    // Tank vs Vitesse
      ['tank', 'berserker'],   // Résistance vs Dégâts
      ['assassin', 'polyvalent'], // Vitesse vs Équilibre
      ['polyvalent', 'berserker'], // Équilibre vs Dégâts
      ['tank', 'polyvalent'],   // Défense vs Équilibre
      ['assassin', 'berserker'] // Vitesse vs Force
    ];

    const pair = balancedPairs[Math.floor(Math.random() * balancedPairs.length)];
    
    return {
      fighter1: this.getProfile(pair[0]),
      fighter2: this.getProfile(pair[1])
    };
  }

  /**
   * Calcule la puissance théorique d'un profil
   */
  calculatePower(profile) {
    const stats = profile.stats;
    let power = 0;

    // HP value (endurance * 6 + base 50)
    power += stats.maxHealth * 0.5;
    
    // Stats raw value
    power += (stats.strength + stats.agility + stats.speed + stats.endurance) * 2;
    
    // Skills bonus
    power += profile.skills.length * 15;
    
    // Weapon power
    if (profile.weapons && profile.weapons.length > 0) {
      // Estimation basée sur les dégâts d'arme moyens
      const weaponPowerMap = {
        knife: 25,
        sword: 18,
        axe: 35,
        stoneHammer: 30
      };
      power += weaponPowerMap[profile.weapons[0]] || 20;
    }
    
    // Pet bonus
    if (profile.pet) {
      power += 40; // Les pets ajoutent de la puissance
    }

    return Math.floor(power);
  }

  /**
   * Vérifie l'équilibre entre deux profils
   */
  checkBalance(profile1, profile2) {
    const power1 = this.calculatePower(profile1);
    const power2 = this.calculatePower(profile2);
    
    const difference = Math.abs(power1 - power2);
    const average = (power1 + power2) / 2;
    const balanceRatio = difference / average;

    return {
      power1,
      power2,
      difference,
      balanceRatio,
      isBalanced: balanceRatio < 0.15 // Moins de 15% de différence
    };
  }
}

// Instance singleton
export const profileGenerator = new ProfileGenerator();

// ================================================
// UTILITAIRES POUR L'INTÉGRATION PHASER
// ================================================

/**
 * Convertit un profil de test en format compatible avec FightSceneSpine
 */
export function convertProfileToFighter(profile) {
  return {
    name: profile.name,
    stats: {
      name: profile.stats.name,
      health: profile.stats.health,
      maxHealth: profile.stats.maxHealth,
      strength: profile.stats.strength,
      agility: profile.stats.agility,
      speed: profile.stats.speed,
      endurance: profile.stats.endurance
    },
    skills: profile.skills || [],
    weapons: profile.weapons || [],
    pet: profile.pet || null,
    spineModel: profile.spineModel || "spineboy",
    // Ajout de propriétés pour la compatibilité
    level: profile.level || 10,
    weapon: profile.weapons && profile.weapons[0] ? profile.weapons[0] : null,
    hasWeapon: !!(profile.weapons && profile.weapons[0])
  };
}

/**
 * Génère un combat de test avec deux profils équilibrés
 */
export function generateTestFight() {
  const matchup = profileGenerator.getBalancedMatchup();
  
  console.log('=== GÉNÉRATION COMBAT DE TEST ===');
  console.log(`Fighter 1: ${matchup.fighter1.name} (${matchup.fighter1.skills.join(', ')})`);
  console.log(`Fighter 2: ${matchup.fighter2.name} (${matchup.fighter2.skills.join(', ')})`);
  
  const balance = profileGenerator.checkBalance(matchup.fighter1, matchup.fighter2);
  console.log(`Équilibre: ${balance.power1} vs ${balance.power2} (${balance.isBalanced ? 'ÉQUILIBRÉ' : 'DÉSÉQUILIBRÉ'})`);
  
  return {
    a: convertProfileToFighter(matchup.fighter1),
    b: convertProfileToFighter(matchup.fighter2),
    balance: balance
  };
}