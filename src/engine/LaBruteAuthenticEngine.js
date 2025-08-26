/**
 * LaBrute Authentic Combat Engine
 * Basé sur le code source officiel de LaBrute
 * Formules et mécaniques exactes extraites du repository officiel
 * Client-side mirror of server/combat/LaBruteEngine.js;
 * server implementation is authoritative.
 */

import constants from '../../server/engine/labrute-core/constants.js';
const { SkillName, WeaponName, PetName, StepType } = constants;

export class LaBruteAuthenticEngine {
  constructor() {
    this.fighters = [];
    this.steps = [];
    this.initiative = 0;
    this.turn = 0;
    this.seed = null;
    this.random = null;
  }

  /**
   * Initialise le moteur avec une seed pour la reproductibilité
   */
  initialize(seed = Date.now()) {
    this.seed = seed;
    this.random = this.createSeededRandom(seed);
    this.steps = [];
    this.initiative = 0;
    this.turn = 0;
  }

  /**
   * Générateur de nombres aléatoires avec seed (Mulberry32)
   */
  createSeededRandom(seed) {
    let state = seed;
    return () => {
      state |= 0;
      state = state + 0x6D2B79F5 | 0;
      let t = Math.imul(state ^ state >>> 15, 1 | state);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  /**
   * Configure les combattants
   */
  setFighters(fighter1, fighter2) {
    // Convertir les stats au format LaBrute officiel
    this.fighters = [
      this.createDetailedFighter(fighter1, 0, 'L'),
      this.createDetailedFighter(fighter2, 1, 'R')
    ];
  }

  /**
   * Crée un combattant détaillé selon le format LaBrute
   */
  createDetailedFighter(stats, index, team) {
    // Formule officielle: HP = 50 + (endurance × 6)
    const maxHp = 50 + (stats.endurance || 10) * 6;
    
    return {
      index,
      team,
      name: stats.name || `Fighter ${index + 1}`,
      hp: maxHp,
      maxHp,
      currentHp: maxHp,
      strength: stats.strength || 10,
      agility: stats.agility || 10,
      speed: stats.speed || 10,
      endurance: stats.endurance || 10,
      // Formule initiative: agility × 0.6 + speed × 0.4
      initiative: (stats.agility || 10) * 0.6 + (stats.speed || 10) * 0.4,
      skills: stats.skills || [],
      weapons: stats.weapons || [],
      activeWeapon: null,
      pets: stats.pets || [],
      armor: 0, // Calculé selon les compétences
      damage: 5, // Dégâts de base sans arme
      baseDamage: 5,
      stunned: false,
      trapped: false,
      immune: false,
      survival: false,
      hitBy: {},
      activeSkills: [],
      damagedWeapons: []
    };
  }

  /**
   * Calcule les dégâts selon les formules officielles LaBrute
   */
  getDamage(attacker, defender, thrown = null) {
    const base = thrown 
      ? thrown.damage 
      : (attacker.activeWeapon?.damage || attacker.baseDamage);
    
    let skillsMultiplier = 1;
    
    // Modificateurs de compétences (weaponsMaster, martialArts, etc.)
    if (attacker.skills.includes(SkillName.weaponsMaster) && attacker.activeWeapon) {
      skillsMultiplier += 0.5; // +50% avec arme
    }
    
    if (attacker.skills.includes(SkillName.martialArts) && !attacker.activeWeapon) {
      skillsMultiplier += 1.0; // +100% à mains nues
    }
    
    if (attacker.skills.includes(SkillName.fierceBrute)) {
      skillsMultiplier *= 2; // x2 si fierceBrute actif
    }
    
    // Formule de dégâts officielle
    let damage = 0;
    
    if (thrown) {
      // Formule pour armes lancées
      damage = Math.floor(
        (base + attacker.strength * 0.1 + attacker.agility * 0.15)
        * (1 + this.random() * 0.5) * skillsMultiplier
      );
    } else {
      // Formule standard
      damage = Math.floor(
        (base + attacker.strength * (0.2 + base * 0.05))
        * (0.8 + this.random() * 0.4) * skillsMultiplier
      );
    }
    
    // Coup critique (5% de base)
    const criticalChance = 0.05;
    const criticalHit = this.random() < criticalChance;
    if (criticalHit) {
      damage = Math.floor(damage * 2); // x2 pour coup critique
    }
    
    // Réduction par l'armure (sauf pour les armes lancées)
    if (!thrown) {
      damage = Math.ceil(damage * (1 - defender.armor));
    }
    
    // Dégâts minimum de 1
    if (damage < 1) {
      damage = 1;
    }
    
    return { damage, criticalHit };
  }

  /**
   * Détermine qui joue en premier
   */
  determineFirstFighter() {
    const f1Initiative = this.fighters[0].initiative + this.random() * 10;
    const f2Initiative = this.fighters[1].initiative + this.random() * 10;
    
    if (f1Initiative > f2Initiative) {
      this.fighters[0].initiative = 0;
      this.fighters[1].initiative = 0.5;
    } else {
      this.fighters[0].initiative = 0.5;
      this.fighters[1].initiative = 0;
    }
    
    // Step d'initialisation
    this.steps.push({
      a: StepType.Init,
      fighters: this.fighters.map(f => ({
        index: f.index,
        name: f.name,
        hp: f.hp,
        maxHp: f.maxHp
      }))
    });
  }

  /**
   * Joue le tour d'un combattant
   */
  playFighterTurn(fighter) {
    const opponent = this.fighters.find(f => f.team !== fighter.team);
    
    if (!opponent || opponent.hp <= 0) {
      return false; // Combat terminé
    }
    
    // Calculer les dégâts
    const { damage, criticalHit } = this.getDamage(fighter, opponent);
    
    // Appliquer les dégâts
    opponent.hp -= damage;
    opponent.currentHp = opponent.hp;
    
    // Créer le step de frappe
    const hitStep = {
      a: StepType.Hit,
      f: fighter.index,
      t: opponent.index,
      d: damage
    };
    
    if (criticalHit) {
      hitStep.c = 1;
    }
    
    if (fighter.activeWeapon) {
      hitStep.w = fighter.activeWeapon.id || fighter.activeWeapon.name;
    }
    
    this.steps.push(hitStep);
    
    // Vérifier la mort
    if (opponent.hp <= 0) {
      opponent.hp = 0;
      opponent.currentHp = 0;
      
      this.steps.push({
        a: StepType.Death,
        f: opponent.index
      });
      
      return false; // Combat terminé
    }
    
    return true; // Combat continue
  }

  /**
   * Génère un combat complet
   */
  generateFight() {
    this.determineFirstFighter();
    
    let maxTurns = 100; // Protection contre les boucles infinies
    let combatContinue = true;
    
    while (combatContinue && maxTurns > 0) {
      // Déterminer qui joue
      const currentFighter = this.fighters.sort((a, b) => a.initiative - b.initiative)[0];
      
      // Jouer le tour
      combatContinue = this.playFighterTurn(currentFighter);
      
      // Mettre à jour l'initiative
      currentFighter.initiative = this.initiative + 1;
      this.initiative++;
      
      maxTurns--;
    }
    
    // Déterminer le gagnant
    const winner = this.fighters.find(f => f.hp > 0);
    const loser = this.fighters.find(f => f.hp <= 0);
    
    if (winner && loser) {
      this.steps.push({
        a: StepType.End,
        w: winner.index,
        l: loser.index,
        winner: winner.name,
        loser: loser.name
      });
    }
    
    return {
      steps: this.steps,
      winner: winner ? winner.index : -1,
      seed: this.seed
    };
  }

  /**
   * Obtient l'état actuel des combattants
   */
  getFightersState() {
    return this.fighters.map(f => ({
      index: f.index,
      name: f.name,
      hp: f.currentHp,
      maxHp: f.maxHp,
      team: f.team
    }));
  }
}

// Enum des types de steps (basé sur LaBrute officiel)
export const StepTypes = {
  Init: 'init',
  Move: 'move',
  MoveBack: 'moveBack',
  Hit: 'hit',
  Miss: 'miss',
  Block: 'block',
  Evade: 'evade',
  Counter: 'counter',
  Throw: 'throw',
  Heal: 'heal',
  Death: 'death',
  End: 'end',
  Hammer: 'hammer',
  Poison: 'poison',
  FlashFlood: 'flashFlood',
  Bomb: 'bomb',
  Vampirism: 'vampirism',
  Haste: 'haste',
  Resist: 'resist',
  Survive: 'survive',
  Skill: 'skill',
  Equip: 'equip',
  Saboteur: 'saboteur',
  Disarm: 'disarm',
  Steal: 'steal',
  Trap: 'trap',
  NetTrap: 'netTrap'
};
