// ============================================================================
// LABRUTE COMBAT ENGINE - COMPLETE VERSION
// ============================================================================
// Ce fichier contient le moteur de combat complet de LaBrute avec :
// - Gestion des armes et de leurs effets spéciaux
// - Système de dégâts basé sur les statistiques
// - Compétences (skills) et leurs effets
// - Logique de blocage, esquive et contre-attaque
// - Gestion des pets et de leurs actions
// - Système de combat tour par tour
// ============================================================================

import { hpManager } from './HPManager.js';
// @ts-ignore - JSON data without types
import LABRUTE_WEAPONS from '../game/data/labrute-weapons.json' assert { type: 'json' };

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
// Importées depuis src/game/data/labrute-weapons.json
export { LABRUTE_WEAPONS };

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
    constructor(fighter1, fighter2, rng, maxTurns = 500) {
        // Compatibility with existing FightSceneSpine
        this.fighter1 = fighter1;
        this.fighter2 = fighter2;
        
        // Initialiser le RNG
        if (typeof rng === 'function') {
            this.rng = rng;
        } else {
            // RNG interne avec seed
            this.rngSeed = rng || Date.now();
            this.rngCounter = 0;
            this.rng = () => {
                this.rngCounter++;
                const x = Math.sin(this.rngSeed + this.rngCounter * 1.234) * 10000;
                return x - Math.floor(x);
            };
        }
        
        this.activeIndex = 0;
        this.turn = 0;
        this.maxTurns = maxTurns;
        this.winner = null;
        this.combatLog = [];
        this.hpManager = hpManager;
        
        // Initialiser le gestionnaire HP centralisé
        this.hpManager.reset();
        this.hpManager.setDebug(true);
        
        // Préparer les fighters
        this.fighters = [
            this.prepareFighter(fighter1),
            this.prepareFighter(fighter2)
        ];
        
        // Enregistrer les fighters dans le HPManager
        for (const fighter of this.fighters) {
            console.log(`[LaBruteCombat] Registering fighter: ${fighter.name}`);
            this.hpManager.registerFighter(fighter.name, fighter.maxHp, fighter.currentHp, fighter.skills);
        }
        
        // Calculer l'initiative
        this.calculateInitiative();
    }
    
    // MÉCANIQUE OFFICIELLE : Calcul de l'initiative
    calculateInitiative() {
        const init1 = this.fighters[0].stats?.speed || 10;
        const init2 = this.fighters[1].stats?.speed || 10;
        
        // Celui avec la plus grande vitesse commence
        if (init1 > init2) {
            this.activeIndex = 0;
        } else if (init2 > init1) {
            this.activeIndex = 1;
        } else {
            // Égalité : au hasard
            this.activeIndex = this.rng() < 0.5 ? 0 : 1;
        }
        
        console.log(`[Initiative] ${this.fighters[this.activeIndex].name} commence le combat`);
    }
    
    prepareFighter(fighter) {
        const prepared = { ...fighter };
        
        // Assurer qu'on a un nom pour le fighter
        prepared.name = fighter.name || fighter.stats?.name || 'Fighter';
        console.log(`[prepareFighter] Preparing fighter: ${prepared.name}`);
        
        // Si le fighter a déjà des stats de combat (depuis FightSceneSpine)
        if (fighter.stats) {
            // Utiliser les HP existants si définis
            if (fighter.stats.health !== undefined && fighter.stats.maxHealth !== undefined) {
                prepared.maxHp = fighter.stats.maxHealth;
                prepared.currentHp = fighter.stats.health;
                
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
            
            // S'assurer qu'on a les stats de base
            if (!prepared.stats) {
                prepared.stats = {
                    strength: fighter.strength || 10,
                    agility: fighter.agility || 10,
                    speed: fighter.speed || 10,
                    endurance: fighter.endurance || 10
                };
            }
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
    
    // Résolution d'attaque (tuning: combats plus rapides, moins de ratés)
    performAttack(attacker, defender) {
        // Déterminer l'arme
        const weapon = attacker.currentWeapon || attacker.activeWeapon || null;
        
        // Chance de toucher
        const attackerAgi = (attacker.agility ?? attacker.stats?.agility ?? 0);
        const defenderAgi = (defender.agility ?? defender.stats?.agility ?? 0);
        const baseHitChance = 0.7; // 70%
        const agilityBonus = (attackerAgi - defenderAgi) * 0.01; // impact réduit
        const rawWeaponAcc = (weapon && LABRUTE_WEAPONS[weapon] && typeof LABRUTE_WEAPONS[weapon].accuracy === 'number')
          ? LABRUTE_WEAPONS[weapon].accuracy / 100
          : (weapon ? 0.10 : 0); // léger bonus si arme équipée
        let hitChance = baseHitChance + agilityBonus + rawWeaponAcc;
        if (attacker.skills?.includes('precision')) hitChance += 0.05;
        hitChance = Math.max(0.5, Math.min(0.95, hitChance));
        
        console.log(`HIT CHANCE: ${attacker.name} vs ${defender.name} = ${(hitChance * 100).toFixed(1)}%`);
        console.log(`  Base: ${baseHitChance}, Agility bonus: ${agilityBonus.toFixed(2)}, Weapon: ${rawWeaponAcc.toFixed(2)}`);
        
        // Jet pour toucher
        const hitRoll = this.rng();
        if (hitRoll > hitChance) {
            console.log(`MISS! Roll ${hitRoll.toFixed(3)} > ${hitChance.toFixed(3)}`);
            this.log(`${attacker.name} rate son attaque !`);
            return { hit: false, damage: 0 };
        }
        
        // Esquive (réduite)
        const agiDiff = defenderAgi - attackerAgi;
        let dodgeChance = 0.05 + Math.max(0, agiDiff) * 0.0025; // ~5-8%
        if (defender.skills?.includes('dodge')) dodgeChance += 0.02;
        dodgeChance = Math.min(0.10, dodgeChance);
        if (this.rng() < dodgeChance) {
            this.log(`${defender.name} esquive !`);
            return { hit: false, damage: 0, dodge: true };
        }
        
        // Parade (réduite)
        let blockChance = 0.10;
        if (defender.skills?.includes('shield')) blockChance += 0.05;
        if (defender.skills?.includes('armor')) blockChance += 0.03;
        blockChance = Math.min(0.18, blockChance);
        const blocked = this.rng() < blockChance;
        
        // Lancer d'arme (10%)
        if (weapon && this.rng() < 0.10) {
            const damage = Math.floor(LaBruteCombatFormulas.computeBaseDamage(attacker, defender, weapon) * 1.5);
            this.dealDamage(defender, damage);
            this.log(`${attacker.name} lance son ${LABRUTE_WEAPONS[weapon]?.name || weapon} et inflige ${damage} dégâts !`);
            attacker.currentWeapon = null; // arme perdue
            return { hit: true, damage, throw: true };
        }
        
        // Dégâts de base
        let damage = LaBruteCombatFormulas.computeBaseDamage(attacker, defender, weapon);
        
        // Log détaillé
        console.log(`ATTACK CALCULATION: ${attacker.name} -> ${defender.name}`);
        console.log(`  Weapon: ${weapon || 'BARE HANDS'}`);
        console.log(`  Base damage before variation: ${damage}`);
        console.log(`  Attacker strength: ${attacker.strength ?? attacker.stats?.strength}`);
        console.log(`  Defender HP before: ${defender.currentHp}`);
        
        // Variation ±20%
        const variation = 0.8 + this.rng() * 0.4;
        damage = damage * variation;
        console.log(`  Variation: ${variation.toFixed(2)}x, damage after variation: ${damage}`);
        
        // Critique
        const critChance = LaBruteCombatFormulas.computeCritChance(attacker, defender, weapon);
        const critical = this.rng() * 100 < critChance;
        if (critical) damage *= 2;
        
        // Parade réduit les dégâts
        if (blocked) {
            damage *= defender.skills?.includes('armor') ? 0.25 : 0.5;
        }
        
        // Minimum
        damage = Math.max(2, Math.floor(damage));
        console.log(`  Final damage to deal: ${damage}`);
        
        this.dealDamage(defender, damage);
        console.log(`  Defender HP after: ${defender.currentHp}`);
        
        let logMsg = `${attacker.name} frappe pour ${damage} dégâts`;
        if (critical) logMsg += ' (CRITIQUE!)';
        if (blocked) logMsg += ' (paré)';
        this.log(logMsg);
        
        // Combo
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
        
        // Compétences spéciales
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
        console.log(`[dealDamage] ${fighter.name} takes ${damage} damage`);
        
        // Utiliser HPManager pour appliquer les dégâts
        const result = hpManager.applyDamage(fighter.name, damage);
        
        if (result) {
            // Synchroniser avec currentHp
            fighter.currentHp = result.currentHP;
            
            // Synchroniser avec stats.health si présent
            if (fighter.stats) {
                fighter.stats.health = result.currentHP;
            }
            
            // Log pour debug
            console.log(`[dealDamage] ${fighter.name} HP: ${result.currentHP}/${result.maxHP}`);
            
            // Vérifier survival
            if (result.survived) {
                console.log(`[dealDamage] ${fighter.name} SURVIVES with 1 HP!`);
                this.log(`${fighter.name} survit avec 1 HP !`);
            }
        }
    }
    
    checkVictory() {
        const fighter1 = this.fighters[0];
        const fighter2 = this.fighters[1];
        
        if (fighter1.currentHp <= 0) {
            fighter1.currentHp = 0;
            this.winner = fighter2;
            this.log(`[VICTORY] ${fighter1.name} is KO with ${fighter1.currentHp} HP`);
            this.log(`[VICTORY] Winner is ${fighter2.name} with ${fighter2.currentHp} HP`);
            return fighter2;
        }
        
        if (fighter2.currentHp <= 0) {
            fighter2.currentHp = 0;
            this.winner = fighter1;
            this.log(`[VICTORY] ${fighter2.name} is KO with ${fighter2.currentHp} HP`);
            this.log(`[VICTORY] Winner is ${fighter1.name} with ${fighter1.currentHp} HP`);
            return fighter1;
        }
        
        return null;
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