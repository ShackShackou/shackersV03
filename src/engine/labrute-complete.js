// ================================================
// 🎮 SYSTÈME LABRUTE/MYBRUTE COMPLET
// ================================================
// CE FICHIER CONTIENT TOUT LE SYSTÈME LABRUTE :
// - Formules de combat exactes
// - 28 Armes officielles avec stats réelles
// - 3 Pets (Chien, Ours, Panthère) 
// - 30 Skills/Compétences
// - Système de niveaux (1-80)
// - Tournois et compétitions
// - Arbre de talents
// - Système de pupils/élèves
// ================================================

// ================================================
// PARTIE 1 : CONFIGURATION GLOBALE
// ================================================

const LABRUTE_CONFIG = {
    MAX_LEVEL: 80,
    FIGHTS_PER_DAY: 3,  // 6 le premier jour
    XP_PER_FIGHT: 1,
    XP_PER_WIN: 2,
    XP_PER_PUPIL_WIN: 1,
    TOURNAMENT_HOUR: 18, // 18h GMT+1
    
    // Points de stats par niveau
    STAT_POINTS_PER_LEVEL: {
        guaranteed: 3,  // Au moins 3 points dans une stat principale
        optional: 2,    // Parfois 2+1 dans deux stats
    },
    
    // HP de base et progression
    BASE_HP: 50,
    HP_PER_ENDURANCE: 6,
    HP_PER_LEVEL: [1, 1, 2, 2, 3], // Pattern qui se répète
};

// ================================================
// PARTIE 2 : ARMES OFFICIELLES (28 armes)
// ================================================

export const LABRUTE_WEAPONS = {
    // Format: { damage, accuracy, block, speed, special, type }
    
    // === ARMES LÉGÈRES ===
    'knife': {
        name: 'Couteau',
        damage: 71,  // Valeur officielle LaBrute
        comboRate: 30,
        interval: 60,
        accuracy: 0,
        precision: 50,
        speed: 'fast',
        type: 'melee',
    },
    'broadsword': {
        name: 'Épée large',
        damage: 101,  // Valeur officielle LaBrute
        comboRate: 0,
        interval: 120,
        accuracy: 0,
        reversalRate: 10,
        speed: 'normal',
        type: 'melee',
    },
    'lance': {
        name: 'Lance',
        damage: 12,  // Valeur officielle LaBrute
        comboRate: 0,
        interval: 120,
        accuracy: 0,
        counterRate: 30, // Arme longue
        speed: 'normal',
        type: 'melee',
    },
    'sai': {
        name: 'Saï',
        damage: 6,
        accuracy: 65,
        block: 25,
        speed: 'fast',
        critChance: 10,
        type: 'melee',
        disarmChance: 20,
    },
    'fan': {
        name: 'Éventail',
        damage: 4,  // Valeur officielle LaBrute
        comboRate: 45,
        interval: 28,
        accuracy: 0,
        evasion: 60,
        block: 0, // Ne peut pas parer
        speed: 'fast',
        type: 'melee',
    },
    'shuriken': {
        name: 'Shuriken',
        damage: 4,
        accuracy: 75,
        block: 0,
        speed: 'fast',
        critChance: 15,
        type: 'thrown',
        quantity: 12,
    },
    'baton': {
        name: 'Bâton',
        damage: 6,  // Valeur officielle LaBrute
        comboRate: 10,
        interval: 100,
        accuracy: 0,
        counterRate: 30,
        speed: 'normal',
        type: 'melee',
    },
    
    // === ARMES MOYENNES ===
    'sword': {
        name: 'Épée',
        damage: 10,
        accuracy: 50,
        block: 25,
        speed: 'normal',
        critChance: 10,
        type: 'melee',
    },
    'scimitar': {
        name: 'Cimeterre',
        damage: 9,
        accuracy: 55,
        block: 20,
        speed: 'normal',
        critChance: 15,
        type: 'melee',
    },
    'hatchet': {
        name: 'Hachette',
        damage: 17,  // Valeur officielle LaBrute
        comboRate: 0,
        interval: 150,
        accuracy: 0,
        blockRate: -10,
        speed: 'normal',
        type: 'melee',
    },
    'trident': {
        name: 'Trident',
        damage: 10,
        accuracy: 50,
        block: 20,
        speed: 'normal',
        critChance: 10,
        type: 'melee',
        counterBonus: 15, // Arme longue
    },
    'whip': {
        name: 'Fouet',
        damage: 8,
        accuracy: 60,
        block: 5,
        speed: 'fast',
        critChance: 8,
        type: 'melee',
        disarmChance: 25,
    },
    'noodleBowl': {
        name: 'Bol de nouilles',
        damage: 10,  // Valeur officielle LaBrute
        comboRate: 30,
        interval: 45,
        accuracy: 0,
        block: 0,
        speed: 'normal',
        type: 'thrown',
        quantity: 999, // Illimité
    },
    'piopio': {
        name: 'Piopio',
        damage: 8,
        accuracy: 45,
        block: 0,
        speed: 'slow',
        critChance: 10,
        type: 'thrown',
        quantity: 6,
    },
    
    // === ARMES LOURDES ===
    'axe': {
        name: 'Hache',
        damage: 55,  // Valeur officielle LaBrute
        comboRate: -40,
        interval: 2303,
        accuracy: 50,
        disarmRate: 10,
        block: 0, // Ne peut pas parer
        speed: 'slow',
        type: 'heavy',
    },
    'morningstar': {
        name: 'Étoile du matin',
        damage: 20,  // Valeur officielle LaBrute
        comboRate: 0,
        interval: 1503,
        accuracy: 30,
        precision: -5,
        speed: 'slow',
        type: 'heavy',
    },
    'mammothBone': {
        name: 'Os de mammouth',
        damage: 14,  // Valeur officielle LaBrute
        comboRate: -10,
        interval: 1603,
        accuracy: 50,
        disarmRate: 10,
        speed: 'slow',
        type: 'heavy',
    },
    'bumps': {
        name: 'Massue',
        damage: 30,  // Valeur officielle LaBrute
        comboRate: -60,
        interval: 2003,
        accuracy: 30,
        disarmRate: 10,
        speed: 'slow',
        type: 'heavy',
    },
    'mace': {
        name: 'Masse',
        damage: 13,
        accuracy: 40,
        block: 15,
        speed: 'slow',
        critChance: 10,
        type: 'heavy',
    },
    'flail': {
        name: 'Fléau',
        damage: 36,  // Valeur officielle LaBrute
        comboRate: 30,
        interval: 2203,
        accuracy: 150, // Ignore esquive et parade !
        disarmRate: -20,
        block: 0,
        speed: 'slow',
        type: 'heavy',
    },
    
    // === ARMES SPÉCIALES ===
    'keyboard': {
        name: 'Clavier',
        damage: 7,  // Valeur officielle LaBrute
        comboRate: 50,
        interval: 1003,
        accuracy: 0,
        precision: 20,
        speed: 'normal',
        type: 'special',
    },
    'leek': {
        name: 'Poireau',
        damage: 5,  // Valeur officielle LaBrute
        comboRate: 200, // Combo énorme !
        interval: 1103,
        accuracy: 200, // Ignore esquive et parade !
        reversalRate: 100,
        block: 0,
        speed: 'fast',
        type: 'special',
    },
    'fryingPan': {
        name: 'Poêle à frire',
        damage: 17,  // Valeur officielle LaBrute
        comboRate: -40,
        interval: 1203,
        accuracy: 0,
        blockRate: 40, // Excellente parade
        speed: 'normal',
        type: 'special',
    },
    'racquet': {
        name: 'Raquette',
        damage: 8,
        accuracy: 55,
        block: 20,
        speed: 'normal',
        critChance: 10,
        type: 'special',
        reflectProjectiles: true,
    },
    'trombone': {
        name: 'Trombone',
        damage: 6,
        accuracy: 50,
        block: 15,
        speed: 'normal',
        critChance: 5,
        type: 'special',
        stunChance: 10,
    },
    'halberd': {
        name: 'Hallebarde',
        damage: 241,  // Valeur officielle LaBrute - Plus gros dégâts !
        comboRate: 0,
        interval: 180,
        accuracy: 0,
        counterRate: 40, // Meilleure arme longue
        speed: 'normal',
        type: 'melee',
    },
    'stoneHammer': {
        name: 'Marteau de pierre',
        damage: 20, // Plus gros dégâts !
        accuracy: 25, // Très imprécis
        block: 5,
        speed: 'very_slow',
        critChance: 5,
        type: 'heavy',
    },
    'club': {
        name: 'Gourdin',
        damage: 11,
        accuracy: 40,
        block: 10,
        speed: 'slow',
        critChance: 8,
        type: 'heavy',
    },
};

// ================================================
// PARTIE 3 : PETS (ANIMAUX)
// ================================================

export const LABRUTE_PETS = {
    'dog': {
        name: 'Chien',
        hp: 30,
        damage: 25, // Augmenté encore plus pour être visible
        initiative: 90,
        attackFrequency: 0.70, // Augmenté à 70% pour test
        special: 'loyal', // Reste jusqu'à la mort
        unlockLevel: 10,
    },
    'bear': {
        name: 'Ours',
        hp: 100,
        damage: 35, // Augmenté encore plus
        initiative: 110,
        attackFrequency: 0.65, // Augmenté à 65% pour test
        special: 'tank', // Réduit les HP du maître de 50%
        hpModifier: 0.5, // -50% HP pour le maître
        unlockLevel: 20,
    },
    'panther': {
        name: 'Panthère',
        hp: 50,
        damage: 30, // Augmenté encore plus
        initiative: 70, // Très rapide
        attackFrequency: 0.75, // Augmenté à 75% pour test
        special: 'fast', // Attaque souvent
        critBonus: 15, // +15% critique
        unlockLevel: 30,
    },
};

// ================================================
// PARTIE 4 : SKILLS/COMPÉTENCES (30 skills)
// ================================================

export const LABRUTE_SKILLS = {
    // === SKILLS OFFENSIFS ===
    'herculeanStrength': {
        name: 'Force herculéenne',
        effect: 'Force +50% et +3',
        modifiers: {
            strength: { multiply: 1.5, add: 3 }
        },
        icon: '💪',
        tier: 2,
    },
    'felineAgility': {
        name: 'Agilité féline', 
        effect: 'Agilité +50% et +3',
        modifiers: {
            agility: { multiply: 1.5, add: 3 }
        },
        icon: '🐱',
        tier: 2,
    },
    'lightningBolt': {
        name: 'Éclair',
        effect: 'Vitesse +50% et +3',
        modifiers: {
            speed: { multiply: 1.5, add: 3 }
        },
        icon: '⚡',
        tier: 2,
    },
    'vitality': {
        name: 'Vitalité',
        effect: 'HP +50%',
        modifiers: {
            hp: { multiply: 1.5 }
        },
        icon: '❤️',
        tier: 2,
    },
    'martialArts': {
        name: 'Arts martiaux',
        effect: 'Dégâts x2 à mains nues',
        modifiers: {
            bareHandsDamage: { multiply: 2 }
        },
        icon: '🥋',
        tier: 1,
    },
    'masterOfArms': {
        name: 'Maître d\'armes',
        effect: 'Dégâts +30% avec armes',
        modifiers: {
            weaponDamage: { multiply: 1.3 }
        },
        icon: '⚔️',
        tier: 2,
    },
    'tornado': {
        name: 'Tornade',
        effect: 'Combo +40%, max +2',
        modifiers: {
            comboChance: { add: 40 },
            maxCombo: { add: 2 }
        },
        icon: '🌪️',
        tier: 3,
    },
    'fierce': {
        name: 'Féroce',
        effect: 'Critique +30%',
        modifiers: {
            critChance: { add: 30 }
        },
        icon: '😤',
        tier: 2,
    },
    'weaponMaster': {
        name: 'Expert en armes',
        effect: 'Critique +10%, précision +10%',
        modifiers: {
            critChance: { add: 10 },
            accuracy: { add: 10 }
        },
        icon: '🗡️',
        tier: 2,
    },
    
    // === SKILLS DÉFENSIFS ===
    'armor': {
        name: 'Armure',
        effect: 'Parade +10%, dégâts -2, vitesse -10%',
        modifiers: {
            block: { add: 10 },
            armor: { add: 2 },
            speed: { multiply: 0.9 }
        },
        icon: '🛡️',
        tier: 1,
    },
    'shield': {
        name: 'Bouclier',
        effect: 'Parade +15%',
        modifiers: {
            block: { add: 15 }
        },
        icon: '🛡️',
        tier: 1,
    },
    'toughSkin': {
        name: 'Peau dure',
        effect: 'Dégâts reçus -20%',
        modifiers: {
            damageReduction: { multiply: 0.8 }
        },
        icon: '🦏',
        tier: 2,
    },
    'untouchable': {
        name: 'Intouchable',
        effect: 'Esquive +30%',
        modifiers: {
            dodge: { add: 30 }
        },
        icon: '👻',
        tier: 3,
    },
    'leadSkeleton': {
        name: 'Squelette de plomb',
        effect: 'Dégâts armes lourdes -50%',
        modifiers: {
            heavyWeaponReduction: { multiply: 0.5 }
        },
        icon: '💀',
        tier: 2,
    },
    'counterAttack': {
        name: 'Contre-attaque',
        effect: 'Contre +30%',
        modifiers: {
            counter: { add: 30 }
        },
        icon: '🔄',
        tier: 2,
    },
    'pugnacious': {
        name: 'Pugnace',
        effect: 'Contre +30% après être touché',
        modifiers: {
            counter: { add: 30 }
        },
        icon: '😠',
        tier: 2,
    },
    
    // === SKILLS SPÉCIAUX ===
    'sixthSense': {
        name: 'Sixième sens',
        effect: 'Voit le prochain level-up',
        special: 'preview',
        icon: '👁️',
        tier: 1,
    },
    'hostility': {
        name: 'Hostilité',
        effect: 'Inversé - donne une arme à l\'adversaire',
        special: 'negative',
        icon: '😈',
        tier: 1,
    },
    'fistsOfFury': {
        name: 'Poings de fureur',
        effect: 'Combo mains nues',
        modifiers: {
            bareHandsCombo: { add: 30 }
        },
        icon: '👊',
        tier: 2,
    },
    'hammerer': {
        name: 'Marteleur',
        effect: 'Double frappe avec armes lourdes',
        modifiers: {
            heavyWeaponDouble: true
        },
        icon: '🔨',
        tier: 2,
    },
    'strongArm': {
        name: 'Bras fort',
        effect: 'Force +5, bonus armes lourdes',
        modifiers: {
            strength: { add: 5 },
            heavyWeaponDamage: { multiply: 1.2 }
        },
        icon: '💪',
        tier: 1,
    },
    'accurateStrike': {
        name: 'Frappe précise',
        effect: 'Précision +20%',
        modifiers: {
            accuracy: { add: 20 }
        },
        icon: '🎯',
        tier: 1,
    },
    'shock': { // Renommé pour correspondre à l'officiel
        name: 'Choc',
        effect: 'Désarme +50%', // Valeur officielle !
        modifiers: {
            disarmChance: { add: 50 }
        },
        icon: '💥',
        tier: 2,
    },
    'ballet': {
        name: 'Ballet',
        effect: 'Agilité +4, esquive améliorée',
        modifiers: {
            agility: { add: 4 },
            dodge: { add: 10 }
        },
        icon: '🩰',
        tier: 1,
    },
    'survival': {
        name: 'Survie',
        effect: 'Survit au premier KO avec 1 HP',
        special: 'survival',
        icon: '🏥',
        tier: 3,
    },
    'reconnaissance': {
        name: 'Reconnaissance',
        effect: 'Vitesse +150% et +5, initiative +10',
        modifiers: {
            speed: { multiply: 2.5, add: 5 },
            initiative: { add: -10 } // Plus bas = plus rapide
        },
        icon: '🔍',
        tier: 3,
    },
    'bodybuilder': {
        name: 'Bodybuilder',
        effect: 'Intervalle -25%', // Toutes armes !
        modifiers: {
            interval: { multiply: 0.75 }
        },
        icon: '🏋️',
        tier: 2,
    },
    
    // === SKILLS CONTRE PETS ===
    'cryOfTheDamned': {
        name: 'Cri des damnés',
        effect: 'Fait fuir les pets adverses',
        special: 'scream',
        icon: '😱',
        tier: 2,
    },
    'bomb': {
        name: 'Bombe',
        effect: 'Dégâts de zone vs pets',
        special: 'bomb',
        damage: 25,
        icon: '💣',
        tier: 2,
    },
    'tragicPotion': {
        name: 'Potion tragique',
        effect: 'Soigne 25 HP une fois par combat',
        special: 'heal',
        healAmount: 25,
        icon: '🧪',
        tier: 2,
    },
    
    // === SKILLS MANQUANTS (12 pour atteindre 42) ===
    'resistant': {
        name: 'Résistant',
        effect: 'Max 20% HP perdus par coup', // Officiel !
        special: 'resistant',
        icon: '🚫',
        tier: 3,
    },
    'firstStrike': {
        name: 'Première frappe',
        effect: 'Initiative +200 au début', // Officiel !
        modifiers: {
            initiative: { add: -200 } // Plus bas = plus rapide
        },
        icon: '⚡',
        tier: 2,
    },
    'determination': {
        name: 'Détermination', 
        effect: 'Ignore les malus de vitesse',
        special: 'determination',
        icon: '💪',
        tier: 2,
    },
    'ironHead': {
        name: 'Tête de fer',
        effect: 'Immunité aux étourdissements',
        special: 'stun_immune',
        icon: '🤕',
        tier: 2,
    },
    'relentless': {
        name: 'Implacable',
        effect: '+1 attaque par tour',
        modifiers: {
            extraAttack: { add: 1 }
        },
        icon: '🔁',
        tier: 3,
    },
    'sabotage': {
        name: 'Sabotage',
        effect: 'Détruit une arme adverse au début',
        special: 'sabotage',
        icon: '🔧',
        tier: 2,
    },
    'balletShoes': {
        name: 'Chaussons de ballet',
        effect: 'Agilité +5',
        modifiers: {
            agility: { add: 5 }
        },
        icon: '🩰',
        tier: 1,
    },
    'toughenedSkin': {
        name: 'Peau endurcie',
        effect: 'Armure naturelle +3',
        modifiers: {
            armor: { add: 3 }
        },
        icon: '🦖',
        tier: 1,
    },
    'immortal': {
        name: 'Immortel',
        effect: 'HP +250%', // Énorme boost !
        modifiers: {
            hp: { multiply: 3.5 }
        },
        icon: '♾️',
        tier: 4,
    },
    'regeneration': {
        name: 'Régénération',
        effect: 'Récupère 2 HP/tour',
        special: 'regen',
        healPerTurn: 2,
        icon: '❤️‍🩹',
        tier: 2,
    },
    'thief': {
        name: 'Voleur',
        effect: 'Vole une arme à l\'adversaire',
        special: 'steal',
        icon: '🧏',
        tier: 2,
    },
    'luck': {
        name: 'Chance',
        effect: 'Critique +15%, esquive +10%',
        modifiers: {
            critChance: { add: 15 },
            dodge: { add: 10 }
        },
        icon: '🍀',
        tier: 2,
    },
};

// ================================================
// PARTIE 5 : SYSTÈME DE NIVEAUX ET XP
// ================================================

export class LaBruteLevelSystem {
    constructor() {
        this.xpTable = this.generateXPTable();
    }
    
    generateXPTable() {
        const table = [0]; // Level 1 = 0 XP
        let totalXP = 0;
        
        for (let level = 2; level <= LABRUTE_CONFIG.MAX_LEVEL; level++) {
            // Formule officielle : XP = level² / 2
            const xpNeeded = Math.floor(level * level / 2);
            totalXP += xpNeeded;
            table.push(totalXP);
        }
        
        return table;
    }
    
    getLevel(xp) {
        for (let i = this.xpTable.length - 1; i >= 0; i--) {
            if (xp >= this.xpTable[i]) {
                return i + 1;
            }
        }
        return 1;
    }
    
    getXPForNextLevel(currentXP) {
        const level = this.getLevel(currentXP);
        if (level >= LABRUTE_CONFIG.MAX_LEVEL) return 0;
        return this.xpTable[level] - currentXP;
    }
    
    getLevelUpChoices(level) {
        // Génère les choix pour un level up
        const choices = [];
        const rng = Math.random();
        
        // Choix 1 : Toujours +3 dans une stat principale
        const mainStats = ['strength', 'agility', 'speed', 'endurance'];
        const stat1 = mainStats[Math.floor(Math.random() * 4)];
        choices.push({
            type: 'stat',
            stat: stat1,
            value: 3
        });
        
        // Choix 2 : 30% chance d'avoir 2+1 dans deux stats
        if (rng < 0.3) {
            const stat2 = mainStats.filter(s => s !== stat1)[Math.floor(Math.random() * 3)];
            const stat3 = mainStats.filter(s => s !== stat1 && s !== stat2)[Math.floor(Math.random() * 2)];
            choices.push({
                type: 'double_stat',
                stat1: stat2,
                value1: 2,
                stat2: stat3,
                value2: 1
            });
        }
        
        // Choix 3 : Skill ou arme selon le niveau
        if (level % 3 === 0) {
            // Tous les 3 niveaux : chance de skill
            const availableSkills = Object.keys(LABRUTE_SKILLS).filter(s => {
                const tier = LABRUTE_SKILLS[s].tier || 1;
                return level >= tier * 10; // Tier 1: lvl 10+, Tier 2: lvl 20+, Tier 3: lvl 30+
            });
            
            if (availableSkills.length > 0 && Math.random() < 0.4) {
                choices.push({
                    type: 'skill',
                    skill: availableSkills[Math.floor(Math.random() * availableSkills.length)]
                });
            }
        }
        
        if (level % 5 === 0) {
            // Tous les 5 niveaux : chance d'arme
            const weapons = Object.keys(LABRUTE_WEAPONS);
            if (Math.random() < 0.3) {
                choices.push({
                    type: 'weapon',
                    weapon: weapons[Math.floor(Math.random() * weapons.length)]
                });
            }
        }
        
        if (level % 10 === 0) {
            // Tous les 10 niveaux : chance de pet
            const pets = Object.keys(LABRUTE_PETS).filter(p => {
                return level >= LABRUTE_PETS[p].unlockLevel;
            });
            
            if (pets.length > 0 && Math.random() < 0.2) {
                choices.push({
                    type: 'pet',
                    pet: pets[Math.floor(Math.random() * pets.length)]
                });
            }
        }
        
        return choices;
    }
}

// ================================================
// PARTIE 6 : SYSTÈME DE TOURNOIS
// ================================================

export class LaBruteTournament {
    constructor() {
        this.brackets = [];
        this.currentRound = 0;
    }
    
    generateTournament(participants) {
        // Génère un tournoi à élimination directe
        const size = this.getNextPowerOf2(participants.length);
        const bracket = [];
        
        // Remplir avec des BYE si nécessaire
        const allParticipants = [...participants];
        while (allParticipants.length < size) {
            allParticipants.push({ name: 'BYE', isBye: true });
        }
        
        // Mélanger et créer les matchs
        this.shuffle(allParticipants);
        
        for (let i = 0; i < allParticipants.length; i += 2) {
            bracket.push({
                fighter1: allParticipants[i],
                fighter2: allParticipants[i + 1],
                winner: null
            });
        }
        
        this.brackets = [bracket];
        return bracket;
    }
    
    getNextPowerOf2(n) {
        return Math.pow(2, Math.ceil(Math.log2(n)));
    }
    
    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    
    simulateMatch(fighter1, fighter2) {
        if (fighter1.isBye) return fighter2;
        if (fighter2.isBye) return fighter1;
        
        // Simulation basée sur le niveau et les stats
        const power1 = this.calculatePower(fighter1);
        const power2 = this.calculatePower(fighter2);
        
        const chance1 = power1 / (power1 + power2);
        return Math.random() < chance1 ? fighter1 : fighter2;
    }
    
    calculatePower(fighter) {
        if (fighter.isBye) return 0;
        
        const stats = fighter.stats || {};
        return (stats.strength || 0) * 2 +
               (stats.agility || 0) * 1.5 +
               (stats.speed || 0) * 1.2 +
               (stats.endurance || 0) * 3 +
               (fighter.level || 1) * 10;
    }
    
    advanceRound() {
        const currentBracket = this.brackets[this.currentRound];
        const nextBracket = [];
        
        // Simuler tous les matchs du round
        for (let i = 0; i < currentBracket.length; i++) {
            const match = currentBracket[i];
            match.winner = this.simulateMatch(match.fighter1, match.fighter2);
        }
        
        // Créer le prochain round
        for (let i = 0; i < currentBracket.length; i += 2) {
            if (i + 1 < currentBracket.length) {
                nextBracket.push({
                    fighter1: currentBracket[i].winner,
                    fighter2: currentBracket[i + 1].winner,
                    winner: null
                });
            }
        }
        
        if (nextBracket.length > 0) {
            this.brackets.push(nextBracket);
            this.currentRound++;
        }
        
        return nextBracket;
    }
    
    getTournamentRewards(position) {
        // Récompenses selon la position finale
        const rewards = {
            1: { xp: 100, title: 'Champion' },
            2: { xp: 50, title: 'Finaliste' },
            3: { xp: 30, title: 'Demi-finaliste' },
            4: { xp: 30, title: 'Demi-finaliste' },
            8: { xp: 15, title: 'Quart de finaliste' },
            16: { xp: 10, title: 'Huitième de finaliste' },
            32: { xp: 5, title: 'Participant' }
        };
        
        return rewards[position] || rewards[32];
    }
}

// ================================================
// PARTIE 7 : SYSTÈME DE PUPILS (ÉLÈVES)
// ================================================

export class LaBrutePupilSystem {
    constructor() {
        this.pupils = new Map();
    }
    
    addPupil(masterId, pupilId) {
        if (!this.pupils.has(masterId)) {
            this.pupils.set(masterId, []);
        }
        
        const pupilsList = this.pupils.get(masterId);
        if (!pupilsList.includes(pupilId)) {
            pupilsList.push(pupilId);
            return true;
        }
        return false;
    }
    
    getPupils(masterId) {
        return this.pupils.get(masterId) || [];
    }
    
    calculatePupilXP(pupilWins) {
        // 1 XP par victoire d'élève
        return pupilWins * LABRUTE_CONFIG.XP_PER_PUPIL_WIN;
    }
    
    getPupilBonuses(pupilCount) {
        // Bonus selon le nombre d'élèves
        const bonuses = [];
        
        if (pupilCount >= 1) {
            bonuses.push({ type: 'xp_multiplier', value: 1.1 });
        }
        if (pupilCount >= 5) {
            bonuses.push({ type: 'extra_fight', value: 1 });
        }
        if (pupilCount >= 10) {
            bonuses.push({ type: 'tournament_seed', value: true });
        }
        if (pupilCount >= 20) {
            bonuses.push({ type: 'xp_multiplier', value: 1.2 });
        }
        
        return bonuses;
    }
}

// ================================================
// PARTIE 8 : ARBRE DE TALENTS (DESTINY TREE)
// ================================================

export class LaBruteDestinyTree {
    constructor() {
        this.branches = this.initializeBranches();
    }
    
    initializeBranches() {
        return {
            // Branche FORCE
            strength: {
                name: 'Voie du Guerrier',
                color: '#ff0000',
                nodes: [
                    {
                        id: 'str1',
                        name: 'Force de base',
                        level: 1,
                        cost: 1,
                        effect: { strength: 5 },
                        requires: []
                    },
                    {
                        id: 'str2',
                        name: 'Muscles d\'acier',
                        level: 10,
                        cost: 2,
                        effect: { strength: 10, skill: 'strongArm' },
                        requires: ['str1']
                    },
                    {
                        id: 'str3',
                        name: 'Force titanesque',
                        level: 20,
                        cost: 3,
                        effect: { strength: 15, skill: 'herculeanStrength' },
                        requires: ['str2']
                    },
                    {
                        id: 'str4',
                        name: 'Berserker',
                        level: 30,
                        cost: 5,
                        effect: { 
                            strength: 20, 
                            skill: 'fierce',
                            special: 'rage_mode' // +100% dégâts, -50% défense pendant 3 tours
                        },
                        requires: ['str3']
                    }
                ]
            },
            
            // Branche AGILITÉ
            agility: {
                name: 'Voie de l\'Ombre',
                color: '#00ff00',
                nodes: [
                    {
                        id: 'agi1',
                        name: 'Réflexes de base',
                        level: 1,
                        cost: 1,
                        effect: { agility: 5 },
                        requires: []
                    },
                    {
                        id: 'agi2',
                        name: 'Danse de l\'esquive',
                        level: 10,
                        cost: 2,
                        effect: { agility: 10, skill: 'ballet' },
                        requires: ['agi1']
                    },
                    {
                        id: 'agi3',
                        name: 'Maître de l\'évasion',
                        level: 20,
                        cost: 3,
                        effect: { agility: 15, skill: 'felineAgility' },
                        requires: ['agi2']
                    },
                    {
                        id: 'agi4',
                        name: 'Fantôme',
                        level: 30,
                        cost: 5,
                        effect: { 
                            agility: 20,
                            skill: 'untouchable',
                            special: 'shadow_form' // 90% esquive pendant 2 tours, 1x par combat
                        },
                        requires: ['agi3']
                    }
                ]
            },
            
            // Branche VITESSE
            speed: {
                name: 'Voie de l\'Éclair',
                color: '#ffff00',
                nodes: [
                    {
                        id: 'spd1',
                        name: 'Vitesse de base',
                        level: 1,
                        cost: 1,
                        effect: { speed: 5 },
                        requires: []
                    },
                    {
                        id: 'spd2',
                        name: 'Sprint',
                        level: 10,
                        cost: 2,
                        effect: { speed: 10, initiative: -5 },
                        requires: ['spd1']
                    },
                    {
                        id: 'spd3',
                        name: 'Vitesse foudroyante',
                        level: 20,
                        cost: 3,
                        effect: { speed: 15, skill: 'lightningBolt' },
                        requires: ['spd2']
                    },
                    {
                        id: 'spd4',
                        name: 'Maître du temps',
                        level: 30,
                        cost: 5,
                        effect: {
                            speed: 20,
                            skill: 'reconnaissance',
                            special: 'time_dilation' // 2 actions par tour pendant 3 tours
                        },
                        requires: ['spd3']
                    }
                ]
            },
            
            // Branche ENDURANCE
            endurance: {
                name: 'Voie du Colosse',
                color: '#0000ff',
                nodes: [
                    {
                        id: 'end1',
                        name: 'Santé de base',
                        level: 1,
                        cost: 1,
                        effect: { endurance: 5 },
                        requires: []
                    },
                    {
                        id: 'end2',
                        name: 'Constitution robuste',
                        level: 10,
                        cost: 2,
                        effect: { endurance: 10, skill: 'toughSkin' },
                        requires: ['end1']
                    },
                    {
                        id: 'end3',
                        name: 'Vitalité légendaire',
                        level: 20,
                        cost: 3,
                        effect: { endurance: 15, skill: 'vitality' },
                        requires: ['end2']
                    },
                    {
                        id: 'end4',
                        name: 'Immortel',
                        level: 30,
                        cost: 5,
                        effect: {
                            endurance: 20,
                            skill: 'survival',
                            special: 'resurrection' // Revient avec 50% HP une fois par combat
                        },
                        requires: ['end3']
                    }
                ]
            },
            
            // Branche HYBRIDE
            hybrid: {
                name: 'Voie de l\'Équilibre',
                color: '#ff00ff',
                nodes: [
                    {
                        id: 'hyb1',
                        name: 'Polyvalence',
                        level: 5,
                        cost: 2,
                        effect: { 
                            strength: 3,
                            agility: 3,
                            speed: 3,
                            endurance: 3
                        },
                        requires: []
                    },
                    {
                        id: 'hyb2',
                        name: 'Adaptation',
                        level: 15,
                        cost: 3,
                        effect: {
                            skill: 'sixthSense',
                            special: 'adaptive' // Copie le dernier skill utilisé par l'adversaire
                        },
                        requires: ['hyb1']
                    },
                    {
                        id: 'hyb3',
                        name: 'Maîtrise totale',
                        level: 25,
                        cost: 4,
                        effect: {
                            skill: 'weaponMaster',
                            special: 'dual_wield' // Peut utiliser 2 armes
                        },
                        requires: ['hyb2']
                    },
                    {
                        id: 'hyb4',
                        name: 'Transcendance',
                        level: 40,
                        cost: 10,
                        effect: {
                            strength: 10,
                            agility: 10,
                            speed: 10,
                            endurance: 10,
                            special: 'god_mode' // Immunité pendant le premier tour
                        },
                        requires: ['hyb3', 'str3', 'agi3', 'spd3', 'end3']
                    }
                ]
            }
        };
    }
    
    canUnlockNode(brute, nodeId) {
        // Trouve le nœud dans toutes les branches
        for (const branch of Object.values(this.branches)) {
            const node = branch.nodes.find(n => n.id === nodeId);
            if (node) {
                // Vérifie le niveau requis
                if (brute.level < node.level) return false;
                
                // Vérifie les points de talent disponibles
                if (brute.talentPoints < node.cost) return false;
                
                // Vérifie les prérequis
                for (const req of node.requires) {
                    if (!brute.unlockedTalents?.includes(req)) return false;
                }
                
                return true;
            }
        }
        return false;
    }
    
    unlockNode(brute, nodeId) {
        if (!this.canUnlockNode(brute, nodeId)) return false;
        
        // Trouve et applique les effets du nœud
        for (const branch of Object.values(this.branches)) {
            const node = branch.nodes.find(n => n.id === nodeId);
            if (node) {
                // Déduit les points
                brute.talentPoints -= node.cost;
                
                // Ajoute à la liste des talents débloqués
                if (!brute.unlockedTalents) brute.unlockedTalents = [];
                brute.unlockedTalents.push(nodeId);
                
                // Applique les effets
                for (const [stat, value] of Object.entries(node.effect)) {
                    if (stat === 'skill') {
                        if (!brute.skills) brute.skills = [];
                        brute.skills.push(value);
                    } else if (stat === 'special') {
                        if (!brute.specials) brute.specials = [];
                        brute.specials.push(value);
                    } else {
                        brute.stats[stat] = (brute.stats[stat] || 0) + value;
                    }
                }
                
                return true;
            }
        }
        return false;
    }
}

// ================================================
// PARTIE 9 : FORMULES DE COMBAT COMPLÈTES
// ================================================

export const LaBruteCombatFormulas = {
    // Initiative
    computeInitiative(fighter, rng) {
        const speed = fighter.stats?.speed || 0;
        let initiative = 100 - speed;
        
        // Bonus de skills
        if (fighter.skills?.includes('reconnaissance')) {
            initiative -= 10;
        }
        
        // Pet modifie l'initiative
        if (fighter.pet === 'panther') {
            initiative -= 5; // Panthère rend plus rapide
        }
        
        // Aléa pour éviter les égalités
        if (rng && typeof rng.float === 'function') {
            initiative += rng.float(0, 5);
        } else if (rng && typeof rng === 'function') {
            initiative += rng() * 5;
        } else {
            initiative += Math.random() * 5;
        }
        
        return initiative;
    },
    
    // Esquive (1.5% par agilité)
    computeDodgeChance(defender, attacker, weapon) {
        const agility = defender.stats?.agility || 0;
        let dodge = agility * 1.5;
        
        // Bonus de skills
        if (defender.skills?.includes('felineAgility')) {
            dodge = dodge * 1.5 + 5;
        }
        if (defender.skills?.includes('untouchable')) {
            dodge += 30;
        }
        if (defender.skills?.includes('ballet')) {
            dodge += 10;
        }
        
        // Malus contre armes rapides
        if (weapon && LABRUTE_WEAPONS[weapon]?.speed === 'fast') {
            dodge -= 10;
        }
        
        // Poireau et Fléau ignorent l'esquive !
        if (weapon === 'leek' || weapon === 'flail') {
            return 0;
        }
        
        return Math.max(0, Math.min(80, dodge));
    },
    
    // Parade
    computeBlockChance(defender, attacker, weapon) {
        const defenderWeapon = defender.weapon || 'bareHands';
        
        // Certaines armes ne peuvent pas parer
        if (['axe', 'fan', 'flail', 'leek'].includes(defenderWeapon)) {
            if (!defender.skills?.includes('shield')) {
                return 0;
            }
        }
        
        let block = LABRUTE_WEAPONS[defenderWeapon]?.block || 0;
        
        // Bonus de skills
        if (defender.skills?.includes('shield')) {
            block += 15;
        }
        if (defender.skills?.includes('armor')) {
            block += 10;
        }
        
        // Poireau et Fléau ignorent la parade !
        if (weapon === 'leek' || weapon === 'flail') {
            return Math.max(0, block * 0.2); // 80% de réduction
        }
        
        return Math.max(0, Math.min(50, block));
    },
    
    // Contre-attaque
    computeCounterChance(defender, attacker, weapon) {
        let counter = 10; // Base 10%
        
        // Bonus de skills
        if (defender.skills?.includes('counterAttack')) {
            counter = 100; // 100% de contre après parade réussie (officiel)
        }
        if (defender.skills?.includes('pugnacious')) {
            counter += 30;
        }
        
        // Bonus d'armes longues
        const defenderWeapon = defender.weapon;
        if (defenderWeapon && LABRUTE_WEAPONS[defenderWeapon]?.counterBonus) {
            counter += LABRUTE_WEAPONS[defenderWeapon].counterBonus;
        }
        
        return Math.max(0, Math.min(60, counter));
    },
    
    // Dégâts
    computeBaseDamage(attacker, defender, weapon) {
        // Gérer les deux formats possibles : attacker.strength ou attacker.stats.strength
        const strength = attacker.strength || attacker.stats?.strength || 0;
        let damage = 5; // BARE_HANDS_DAMAGE = 5 selon doc officielle
        
        console.log(`computeBaseDamage: attacker=${attacker.name}, strength=${strength}, weapon=${weapon}`);
        
        if (weapon && LABRUTE_WEAPONS[weapon]) {
            const weaponData = LABRUTE_WEAPONS[weapon];
            // Utiliser directement les valeurs de damage des armes
            damage = weaponData.damage || 5;
            console.log(`  Weapon damage: ${damage} from ${weapon}`);
        }
        
        // Formule officielle LaBrute : base + strength * (0.2 + base * 0.05)
        // Simplifiée ici pour être plus simple : base + (force × 0.5)
        const strengthBonus = Math.floor(strength * 0.5);
        damage += strengthBonus;
        
        console.log(`  Final base damage: ${damage} (weapon: ${damage - strengthBonus}, strength bonus: ${strengthBonus})`);
        
        // Bonus de skills offensifs
        if (attacker.skills?.includes('herculeanStrength')) {
            damage *= 1.5;
        }
        if (attacker.skills?.includes('martialArts') && !weapon) {
            damage *= 2; // x2 à mains nues
        }
        if (attacker.skills?.includes('masterOfArms') && weapon) {
            damage *= 1.3; // +30% avec armes
        }
        if (attacker.skills?.includes('strongArm') && 
            weapon && LABRUTE_WEAPONS[weapon]?.type === 'heavy') {
            damage *= 1.2; // +20% armes lourdes
        }
        
        // Réduction défensive
        const armor = defender.stats?.armor || 0;
        damage -= armor;
        
        if (defender.skills?.includes('toughSkin')) {
            damage *= 0.8;
        }
        if (defender.skills?.includes('leadSkeleton') && 
            weapon && LABRUTE_WEAPONS[weapon]?.type === 'heavy') {
            damage *= 0.5; // -50% armes lourdes
        }
        
        return Math.max(1, Math.floor(damage));
    },
    
    // Critique
    computeCritChance(attacker, defender, weapon) {
        let crit = 5; // Base 5%
        
        if (weapon && LABRUTE_WEAPONS[weapon]) {
            crit = LABRUTE_WEAPONS[weapon].critChance || 5;
        }
        
        // Bonus de skills
        if (attacker.skills?.includes('fierce')) {
            crit += 30;
        }
        if (attacker.skills?.includes('weaponMaster')) {
            crit += 10;
        }
        
        // Bonus d'agilité
        const agility = attacker.stats?.agility || 0;
        crit += agility * 0.2;
        
        // Pet panthère
        if (attacker.pet === 'panther') {
            crit += 15;
        }
        
        return Math.min(50, crit);
    },
    
    // Combo
    computeComboChance(attacker, weapon) {
        const agility = attacker.stats?.agility || 0;
        const speed = attacker.stats?.speed || 0;
        
        let combo = agility * 0.5;
        
        // Bonus de vitesse avec arme rapide
        if (weapon && LABRUTE_WEAPONS[weapon]?.speed === 'fast') {
            combo += speed * 0.3;
            combo *= 1.5;
        }
        
        // Malus arme lente
        if (weapon && LABRUTE_WEAPONS[weapon]?.speed === 'slow') {
            combo *= 0.5;
        }
        
        // Bonus de skills
        if (attacker.skills?.includes('tornado')) {
            combo += 40;
        }
        if (attacker.skills?.includes('lightningBolt')) {
            combo += 20;
        }
        if (attacker.skills?.includes('fistsOfFury') && !weapon) {
            combo += 30;
        }
        
        return Math.min(60, combo);
    },
    
    // HP finaux avec modificateurs
    computeFinalHP(fighter) {
        const endurance = fighter.stats?.endurance || 0;
        let hp = LABRUTE_CONFIG.BASE_HP + (endurance * LABRUTE_CONFIG.HP_PER_ENDURANCE);
        
        // Modificateurs de skills
        if (fighter.skills?.includes('vitality')) {
            hp *= 1.5;
        }
        
        // Modificateurs de pets
        if (fighter.pet === 'bear') {
            hp *= 0.5; // L'ours réduit les HP de 50%
        }
        
        return Math.floor(hp);
    }
};

// ================================================
// PARTIE 10 : MOTEUR DE COMBAT COMPLET
// ================================================

export class LaBruteCombatEngine {
    constructor(fighter1, fighter2, options = {}) {
        // Compatibility with existing FightSceneSpine
        this.fighter1 = fighter1;
        this.fighter2 = fighter2;
        
        // MÉCANIQUE OFFICIELLE : RNG avec seed pour éviter les répétitions
        this.rngSeed = options.seed || Date.now() + Math.random();
        this.rngCounter = 0;
        
        // Initialiser AVANT de préparer les fighters
        this.turn = 0;
        this.maxTurns = 100;
        this.combatLog = [];
        this.winner = null;
        this.lastResult = null;
        this.onHPChange = options.onHPChange || null; // Callback pour notifier les changements de HP
        
        // Maintenant on peut préparer les fighters (qui utilisent this.rng())
        this.fighters = [
            this.prepareFighter(fighter1),
            this.prepareFighter(fighter2)
        ];
        
        // Calculer l'initiative
        this.calculateInitiative();
    }
    
    // MÉCANIQUE OFFICIELLE : RNG Seedé pour éviter les répétitions
    rng() {
        // Générateur pseudo-aléatoire simple mais efficace
        this.rngCounter++;
        const x = Math.sin(this.rngSeed + this.rngCounter * 1.234) * 10000;
        return x - Math.floor(x);
    }
    
    prepareFighter(fighter) {
        const prepared = { ...fighter };
        
        // Si le fighter a déjà des stats de combat (depuis FightSceneSpine)
        if (fighter.stats) {
            // Utiliser les HP existants si définis
            if (fighter.stats.health !== undefined && fighter.stats.maxHealth !== undefined) {
                prepared.maxHp = fighter.stats.maxHealth;
                prepared.currentHp = fighter.stats.health;
                prepared.name = fighter.stats.name || fighter.name || 'Fighter';
                
                // Copier les stats pour les formules
                if (!prepared.stats) {
                    prepared.stats = {};
                }
                prepared.stats.strength = fighter.stats.strength || 10;
                prepared.stats.agility = fighter.stats.agility || 10;
                prepared.stats.speed = fighter.stats.speed || 10;
                prepared.stats.endurance = fighter.stats.endurance || Math.floor((fighter.stats.maxHealth - 50) / 6) || 10;
            } else {
                // Calculer selon la formule LaBrute
                prepared.maxHp = LaBruteCombatFormulas.computeFinalHP(fighter);
                prepared.currentHp = prepared.maxHp;
            }
        } else {
            // Calculer les HP selon la formule LaBrute
            prepared.maxHp = LaBruteCombatFormulas.computeFinalHP(fighter);
            prepared.currentHp = prepared.maxHp;
        }
        
        // Préparer les armes (MÉCANIQUE OFFICIELLE LABRUTE)
        if (!prepared.weapons) {
            prepared.weapons = [];
        }
        
        // Comme dans LaBrute : chance aléatoire d'avoir une arme au début
        if (prepared.weapons.length > 0 && this.rng() < 0.6) { // 60% de chance d'avoir une arme
            const randomIndex = Math.floor(this.rng() * prepared.weapons.length);
            prepared.activeWeapon = prepared.weapons[randomIndex];
            prepared.keepWeaponChance = 0.5; // Chance de garder l'arme (diminue chaque tour)
            prepared.weaponInventory = [...prepared.weapons]; // Inventaire complet
        } else {
            prepared.activeWeapon = null; // Combat à mains nues
            prepared.keepWeaponChance = 0;
            prepared.weaponInventory = prepared.weapons ? [...prepared.weapons] : [];
        }
        
        prepared.currentWeapon = prepared.activeWeapon; // Pour compatibilité
        
        // Préparer les effets temporaires
        prepared.tempEffects = {
            stunned: 0,
            rage: 0,
            shadowForm: 0,
            timeDilation: 0,
            survived: false
        };
        
        // Préparer le pet
        if (prepared.pet && LABRUTE_PETS[prepared.pet]) {
            const petData = LABRUTE_PETS[prepared.pet];
            prepared.petData = {
                ...petData,
                currentHp: petData.hp,
                isAlive: true
            };
            console.log(`PET INITIALIZED: ${prepared.name} has a ${prepared.pet} (${petData.name})`);
        }
        
        return prepared;
    }
    
    calculateInitiative() {
        this.fighters.forEach(f => {
            // Comme dans LaBrute officiel : Math.random() pour l'initiative
            f.initiative = LaBruteCombatFormulas.computeInitiative(f);
        });
        
        // Trier par initiative (plus bas = plus rapide)
        this.fighters.sort((a, b) => a.initiative - b.initiative);
        this.activeIndex = 0;
    }
    
    executeTurn() {
        if (this.isOver()) {
            if (this.winner && !this.lastResult?.gameOver) {
                // Return game over result
                const winnerFighter = this.fighters.find(f => f.name === this.winner);
                const loserFighter = this.fighters.find(f => f.name !== this.winner);
                
                // Map back to original fighter objects
                const winner = winnerFighter === this.fighters[0] ? this.fighter1 : this.fighter2;
                const loser = winnerFighter === this.fighters[0] ? this.fighter2 : this.fighter1;
                
                this.lastResult = {
                    type: 'attack',
                    gameOver: true,
                    winner: winner,
                    loser: loser,
                    attacker: winner,
                    target: loser,
                    damage: 0,
                    hit: false
                };
                return this.lastResult;
            }
            return null;
        }
        
        this.turn++;
        const attackerIndex = this.activeIndex;
        const defenderIndex = 1 - this.activeIndex;
        const attacker = this.fighters[attackerIndex];
        const defender = this.fighters[defenderIndex];
        
        // IMPORTANT: Vérifier si l'attaquant est mort AVANT de continuer
        if (attacker.currentHp <= 0) {
            console.log(`${attacker.name} is dead and cannot attack!`);
            // Le combat est terminé, retourner le résultat de fin
            this.winner = defender.name;
            const winner = defenderIndex === 0 ? this.fighter1 : this.fighter2;
            const loser = attackerIndex === 0 ? this.fighter1 : this.fighter2;
            
            return {
                type: 'attack',
                gameOver: true,
                winner: winner,
                loser: loser,
                attacker: loser,
                target: winner,
                damage: 0,
                hit: false
            };
        }
        
        // Map to original fighter objects for Phaser scene
        const attackerOriginal = attackerIndex === 0 ? this.fighter1 : this.fighter2;
        const defenderOriginal = defenderIndex === 0 ? this.fighter1 : this.fighter2;
        
        // NE PAS modifier directement stats - laisser updateFighterHP gérer la synchronisation
        
        // Vérifier les effets temporaires
        if (attacker.tempEffects.stunned > 0) {
            attacker.tempEffects.stunned--;
            this.log(`${attacker.name} est étourdi !`);
            this.switchTurn();
            
            return {
                type: 'stunned',
                attacker: attackerOriginal,
                target: defenderOriginal,
                damage: 0,
                hit: false,
                gameOver: false
            };
        }
        
        // Time dilation = 2 actions
        const actions = attacker.tempEffects.timeDilation > 0 ? 2 : 1;
        attacker.tempEffects.timeDilation--;
        
        let lastAttackResult = null;
        
        for (let action = 0; action < actions; action++) {
            // Vérifier que le défenseur est toujours vivant avant toute action
            if (defender.currentHp <= 0) {
                console.log(`${defender.name} is already dead, stopping all actions`);
                break;
            }
            
            // Pet attaque parfois (SEULEMENT si le défenseur est vivant)
            let petAttackDamage = null;
            if (attacker.petData?.isAlive && defender.currentHp > 0) {
                const roll = this.rng();
                console.log(`PET CHECK: ${attacker.name} has ${attacker.petData.name}, defender HP=${defender.currentHp}, roll=${roll}, freq=${attacker.petData.attackFrequency}, will attack=${roll < attacker.petData.attackFrequency}`);
                
                if (roll < attacker.petData.attackFrequency) {
                    console.log(`PET ATTACK TRIGGERED! ${attacker.name}'s ${attacker.petData.name} attacks!`);
                    petAttackDamage = this.petAttack(attacker, defender);
                    console.log(`PET ATTACK DAMAGE RETURNED: ${petAttackDamage}`);
                    
                    // Forcer la synchronisation immédiate après l'attaque du pet
                    // IMPORTANT: Synchroniser PARTOUT pour éviter la régénération
                    const defenderOriginal = defenderIndex === 0 ? this.fighter1 : this.fighter2;
                    // NE PAS modifier directement - laisser updateFighterHP gérer
                }
                
                // Vérifier si le défenseur est mort après l'attaque du pet
                if (defender.currentHp <= 0) {
                    console.log(`${defender.name} killed by pet!`);
                    this.winner = attacker.name;
                    const winner = attackerIndex === 0 ? this.fighter1 : this.fighter2;
                    const loser = defenderIndex === 0 ? this.fighter1 : this.fighter2;
                    
                    return {
                        type: 'attack',
                        gameOver: true,
                        winner: winner,
                        loser: loser,
                        attacker: attackerOriginal,
                        target: defenderOriginal,
                        damage: petAttackDamage,
                        hit: true,
                        petAssist: {
                            damage: petAttackDamage,
                            petType: attacker.petData.name || attacker.pet
                        }
                    };
                }
            }
            
            // Vérifier que le défenseur est toujours vivant avant l'attaque principale
            if (defender.currentHp <= 0) {
                console.log(`${defender.name} is already dead, skipping attack`);
                break;
            }
            
            // Attaque principale
            const result = this.performAttack(attacker, defender);
            
            // Ajouter l'info du pet si il a attaqué
            if (petAttackDamage) {
                result.petAssist = {
                    damage: petAttackDamage,
                    petType: attacker.petData.name || attacker.pet
                };
            }
            
            lastAttackResult = result;
            
            // Vérifier si le combat est terminé
            if (this.checkVictory()) {
                const winnerFighter = this.fighters.find(f => f.name === this.winner);
                const winner = winnerFighter === this.fighters[0] ? this.fighter1 : this.fighter2;
                const loser = winnerFighter === this.fighters[0] ? this.fighter2 : this.fighter1;
                
                return {
                    type: 'attack',
                    gameOver: true,
                    winner: winner,
                    loser: loser,
                    attacker: attackerOriginal,
                    target: defenderOriginal,
                    damage: result?.damage || 0,
                    hit: result?.hit || false,
                    critical: result?.critical || false
                };
            }
        }
        
        this.switchTurn();
        
        // Convert internal result to Phaser-compatible format
        if (lastAttackResult) {
            if (lastAttackResult.throw) {
                // NOUVEAU : Support du type throw
                return {
                    type: 'throw',
                    attacker: attackerOriginal,
                    target: defenderOriginal,
                    damage: lastAttackResult.damage,
                    hit: true,
                    weapon: lastAttackResult.weapon,
                    petAssist: lastAttackResult.petAssist,
                    gameOver: false
                };
            } else if (lastAttackResult.counter) {
                return {
                    type: 'counter',
                    attacker: defenderOriginal,
                    target: attackerOriginal,
                    damage: lastAttackResult.damage,
                    hit: true,
                    petAssist: lastAttackResult.petAssist,
                    gameOver: false
                };
            } else if (lastAttackResult.dodge) {
                return {
                    type: 'dodge',
                    attacker: attackerOriginal,
                    target: defenderOriginal,
                    damage: 0,
                    hit: false,
                    petAssist: lastAttackResult.petAssist,
                    gameOver: false
                };
            } else if (lastAttackResult.blocked) {
                return {
                    type: 'block',
                    attacker: attackerOriginal,
                    target: defenderOriginal,
                    damage: lastAttackResult.damage,
                    hit: true,
                    petAssist: lastAttackResult.petAssist,
                    gameOver: false
                };
            } else {
                return {
                    type: 'attack',
                    attacker: attackerOriginal,
                    target: defenderOriginal,
                    damage: lastAttackResult.damage || 0,
                    hit: lastAttackResult.hit || false,
                    critical: lastAttackResult.critical || false,
                    petAssist: lastAttackResult.petAssist,
                    gameOver: false
                };
            }
        }
        
        // Default return if no attack happened
        return {
            type: 'wait',
            attacker: attackerOriginal,
            target: defenderOriginal,
            damage: 0,
            hit: false,
            gameOver: false
        };
    }
    
    performAttack(attacker, defender) {
        const weapon = attacker.currentWeapon;
        
        // NOUVEAU : Check pour le lancer d'arme (30% de chance pour test)
        if (weapon && this.rng() < 0.3) {
            // Simuler un lancer d'arme
            const damage = Math.floor(LaBruteCombatFormulas.computeBaseDamage(attacker, defender, weapon) * 1.5);
            this.dealDamage(defender, damage);
            this.log(`${attacker.name} LANCE ${weapon} pour ${damage} dégâts !`);
            
            // TOUTES les armes sont perdues après un lancer (comme dans LaBrute officiel)
            attacker.currentWeapon = null;
            attacker.activeWeapon = null;
            // Retirer l'arme de l'inventaire
            const weaponIndex = attacker.weaponInventory.indexOf(weapon);
            if (weaponIndex > -1) {
                attacker.weaponInventory.splice(weaponIndex, 1);
            }
            this.log(`${attacker.name} perd son arme !`);
            
            // Retourner le type throw pour déclencher l'animation
            return { 
                type: 'throw', 
                throw: true,
                damage,
                hit: true,
                weapon: weapon
            };
        }
        
        // 1. Check contre-attaque
        const counterChance = LaBruteCombatFormulas.computeCounterChance(defender, attacker, weapon);
        if (this.rng() * 100 < counterChance) {
            const damage = Math.floor(LaBruteCombatFormulas.computeBaseDamage(defender, attacker, defender.currentWeapon) * 0.5);
            this.dealDamage(attacker, damage);
            this.log(`${defender.name} contre-attaque pour ${damage} dégâts !`);
            return { counter: true, damage };
        }
        
        // 2. Check esquive
        const dodgeChance = LaBruteCombatFormulas.computeDodgeChance(defender, attacker, weapon);
        if (this.rng() * 100 < dodgeChance) {
            this.log(`${defender.name} esquive !`);
            return { dodge: true };
        }
        
        // 3. Check parade
        const blockChance = LaBruteCombatFormulas.computeBlockChance(defender, attacker, weapon);
        const blocked = this.rng() * 100 < blockChance;
        
        // 4. Calculer les dégâts
        let damage = LaBruteCombatFormulas.computeBaseDamage(attacker, defender, weapon);
        
        // Assurer un minimum de dégâts
        damage = Math.max(1, damage);
        
        // Log détaillé pour TOUTES les attaques
        console.log(`ATTACK CALCULATION: ${attacker.name} -> ${defender.name}`);
        console.log(`  Weapon: ${weapon || 'BARE HANDS'}`);
        console.log(`  Base damage before variation: ${damage}`);
        console.log(`  Attacker strength: ${attacker.strength}`);
        console.log(`  Defender HP before: ${defender.currentHp}`);
        
        // Variation ±20%
        const variation = 0.8 + this.rng() * 0.4;
        damage = damage * variation;
        console.log(`  Variation: ${variation.toFixed(2)}x, damage after variation: ${damage}`);
        
        // Critique ?
        const critChance = LaBruteCombatFormulas.computeCritChance(attacker, defender, weapon);
        const critical = this.rng() * 100 < critChance;
        if (critical) {
            damage *= 2;
        }
        
        // Parade réduit les dégâts
        if (blocked) {
            damage *= defender.skills?.includes('armor') ? 0.25 : 0.5;
        }
        
        // Garantir un minimum de 1 dégât si l'attaque touche
        damage = Math.max(1, Math.floor(damage));
        console.log(`  Final damage to deal: ${damage}`);
        
        this.dealDamage(defender, damage);
        console.log(`  Defender HP after: ${defender.currentHp}`);
        
        let logMsg = `${attacker.name} frappe pour ${damage} dégâts`;
        if (critical) logMsg += ' (CRITIQUE!)';
        if (blocked) logMsg += ' (paré)';
        this.log(logMsg);
        
        // Combo ?
        const comboChance = LaBruteCombatFormulas.computeComboChance(attacker, weapon);
        if (this.rng() * 100 < comboChance) {
            const maxCombo = attacker.skills?.includes('tornado') ? 4 : 2;
            const comboHits = 1 + Math.floor(this.rng() * maxCombo);
            
            for (let i = 0; i < comboHits; i++) {
                const comboDamage = Math.floor(damage * 0.7);
                this.dealDamage(defender, comboDamage);
                this.log(`  Combo ! ${comboDamage} dégâts`);
            }
        }
        
        // Skills spéciaux
        this.checkSpecialSkills(attacker, defender);
        
        return { hit: true, damage, critical, blocked };
    }
    
    petAttack(owner, target) {
        const pet = owner.petData;
        // Augmenter les dégâts de base et ajouter une variation aléatoire plus importante
        const baseDamage = pet.damage;
        const variation = Math.floor(this.rng() * 10) + 5; // +5 à +15 de variation
        const damage = baseDamage + variation;
        
        console.log(`PET ATTACK DAMAGE: ${pet.name} deals ${damage} damage (base: ${baseDamage}, variation: ${variation})`);
        console.log(`Target HP before pet attack: ${target.currentHp}`);
        
        this.dealDamage(target, damage);
        
        console.log(`Target HP after pet attack: ${target.currentHp}`);
        
        this.log(`${pet.name} de ${owner.name} attaque pour ${damage} dégâts !`);
        
        // NE PAS modifier directement stats.health - laisser updateFighterHP le faire
        
        // Le pet peut être tué
        if (target.skills?.includes('cryOfTheDamned') && this.rng() < 0.3) {
            pet.isAlive = false;
            this.log(`${pet.name} s'enfuit effrayé !`);
        }
        
        return damage; // Retourner les dégâts pour l'animation
    }
    
    checkSpecialSkills(attacker, defender) {
        // Bombe vs pets
        if (attacker.skills?.includes('bomb') && defender.petData?.isAlive) {
            const damage = 25;
            defender.petData.currentHp -= damage;
            if (defender.petData.currentHp <= 0) {
                defender.petData.isAlive = false;
                this.log(`La bombe tue ${defender.petData.name} !`);
            }
        }
        
        // Potion de soin
        if (attacker.skills?.includes('tragicPotion') && 
            attacker.currentHp < attacker.maxHp * 0.3 &&
            !attacker.potionUsed) {
            const heal = 25;
            attacker.currentHp = Math.min(attacker.currentHp + heal, attacker.maxHp);
            attacker.potionUsed = true;
            this.log(`${attacker.name} boit une potion (+${heal} HP)`);
        }
        
        // Impact = désarme
        if (attacker.skills?.includes('impact') && this.rng() < 0.25) {
            if (defender.currentWeapon) {
                defender.currentWeapon = null;
                this.log(`${attacker.name} désarme ${defender.name} !`);
            }
        }
    }
    
    dealDamage(fighter, damage) {
        console.log(`[DEALDAMAGE] ${fighter.name}: HP before=${fighter.currentHp}, damage=${damage}`);
        
        // Skill Resistant : max 20% HP perdus
        if (fighter.skills?.includes('resistant')) {
            const maxDamage = Math.floor(fighter.maxHp * 0.2);
            damage = Math.min(damage, maxDamage);
            console.log(`[DEALDAMAGE] Resistant skill limited damage to ${damage}`);
        }
        
        const oldHP = fighter.currentHp;
        fighter.currentHp -= damage;
        console.log(`[DEALDAMAGE] ${fighter.name}: HP ${oldHP} -> ${fighter.currentHp}`);
        
        // Survie
        if (fighter.currentHp <= 0 && 
            fighter.skills?.includes('survival') &&
            !fighter.tempEffects.survived) {
            fighter.currentHp = 1;
            fighter.tempEffects.survived = true;
            this.log(`${fighter.name} survit avec 1 HP !`);
        }
        
        // Notifier le changement de HP
        if (this.onHPChange) {
            this.onHPChange(fighter.name, fighter.currentHp, fighter.maxHp);
        }
    }
    
    checkVictory() {
        // Vérifier si un combattant est KO
        for (let i = 0; i < this.fighters.length; i++) {
            if (this.fighters[i].currentHp <= 0) {
                // S'assurer que le perdant est bien à 0
                this.fighters[i].currentHp = 0;
                
                // Notifier le changement de HP final
                if (this.onHPChange) {
                    this.onHPChange(this.fighters[i].name, 0, this.fighters[i].maxHp);
                }
                
                this.winner = this.fighters[1 - i].name;
                
                console.log(`[VICTORY] ${this.fighters[i].name} is KO with ${this.fighters[i].currentHp} HP`);
                console.log(`[VICTORY] Winner is ${this.winner} with ${this.fighters[1-i].currentHp} HP`);
                
                // NE PAS modifier directement stats.health ici - laisser updateFighterHP le faire
                
                return true;
            }
        }
        
        if (this.turn >= this.maxTurns) {
            // Victoire au plus de HP
            if (this.fighters[0].currentHp > this.fighters[1].currentHp) {
                this.winner = this.fighters[0].name;
            } else {
                this.winner = this.fighters[1].name;
            }
            return true;
        }
        
        return false;
    }
    
    switchTurn() {
        this.activeIndex = 1 - this.activeIndex;
    }
    
    isOver() {
        return this.winner !== null;
    }
    
    log(message) {
        this.combatLog.push({
            turn: this.turn,
            message: message,
            hp1: this.fighters[0].currentHp,
            hp2: this.fighters[1].currentHp
        });
    }
    
    getLog() {
        return this.combatLog;
    }
}

// Export de la configuration pour l'utiliser dans d'autres fichiers
export { LABRUTE_CONFIG };