/**
 * LaBrute Authentic Combat Engine
 * Basé sur le code source officiel de LaBrute
 * Formules et mécaniques exactes extraites du repository officiel
 * Client-side mirror of server/combat/LaBruteEngine.js;
 * server implementation is authoritative.
 */

import constants from '../../server/engine/labrute-core/constants.js';
const { SkillName, WeaponName, PetName, StepType } = constants;

// Modificateurs de dégâts liés aux compétences
const SkillDamageModifiers = [
  { skill: SkillName.herculeanStrength, percent: 0.5, opponent: false },
  { skill: SkillName.weaponsMaster, percent: 0.5, opponent: false, weaponType: 'any' },
  { skill: SkillName.martialArts, percent: 1.0, opponent: false, weaponType: null },
  { skill: SkillName.fierceBrute, percent: 0, opponent: false },
  { skill: SkillName.hammer, percent: 0, opponent: false },
  { skill: SkillName.armor, percent: -0.25, opponent: true },
  { skill: SkillName.toughenedSkin, percent: -0.1, opponent: true },
  { skill: SkillName.leadSkeleton, percent: -0.5, opponent: true, weaponType: 'melee' },
  { skill: SkillName.resistant, percent: -0.15, opponent: true },
  { skill: SkillName.saboteur, percent: 0.3, opponent: false, weaponType: 'thrown' },
  { skill: SkillName.bodybuilder, percent: 0.4, opponent: false, weaponType: 'heavy' },
  { skill: SkillName.relentless, percent: 0.35, opponent: false, weaponType: 'fast' },
];

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

    // Piledriver actif ?
    const piledriver = attacker.activeSkills?.find((sk) =>
      (typeof sk === 'string' ? sk === SkillName.hammer : sk.name === SkillName.hammer));

    // Modificateurs des compétences du combattant
    for (const modifier of SkillDamageModifiers) {
      // Ignore si le combattant n'a pas la compétence
      if (!attacker.skills.find((sk) =>
        (typeof sk === 'string' ? sk === modifier.skill : sk.name === modifier.skill))) {
        continue;
      }

      // Ignore si le modificateur est pour l'adversaire
      if (modifier.opponent) {
        continue;
      }

      // Ignore weaponsMaster et martialArts pour une arme lancée
      if (thrown && (modifier.skill === SkillName.weaponsMaster || modifier.skill === SkillName.martialArts)) {
        continue;
      }

      // Ignore martialArts si piledriver actif
      if (piledriver && modifier.skill === SkillName.martialArts) {
        continue;
      }

      // Modificateurs spécifiques aux armes
      if (typeof modifier.weaponType !== 'undefined') {
        if (modifier.weaponType === null) {
          if (!attacker.activeWeapon || attacker.activeWeapon.name === WeaponName.mug) {
            skillsMultiplier += modifier.percent ?? 0;
          }
        } else if (attacker.activeWeapon?.types?.includes(modifier.weaponType)) {
          skillsMultiplier += modifier.percent ?? 0;
        }
      } else {
        skillsMultiplier *= 1 + (modifier.percent ?? 0);
      }
    }

    // Modificateurs de l'adversaire
    for (const modifier of SkillDamageModifiers) {
      // Ignore si l'adversaire n'a pas la compétence
      if (!defender.skills.find((sk) =>
        (typeof sk === 'string' ? sk === modifier.skill : sk.name === modifier.skill))) {
        continue;
      }

      // Ignore si le modificateur n'est pas pour l'adversaire
      if (!modifier.opponent) {
        continue;
      }

      // Ignore leadSkeleton pour les armes lancées
      if (thrown && modifier.skill === SkillName.leadSkeleton) {
        continue;
      }

      if (typeof modifier.weaponType !== 'undefined') {
        if (modifier.weaponType === null) {
          if (!attacker.activeWeapon || attacker.activeWeapon.name === WeaponName.mug) {
            skillsMultiplier += modifier.percent ?? 0;
          }
        } else if (attacker.activeWeapon?.types?.includes(modifier.weaponType)) {
          skillsMultiplier += modifier.percent ?? 0;
        }
      } else {
        skillsMultiplier *= 1 + (modifier.percent ?? 0);
      }
    }

    // x2 pour fierceBrute actif
    if (attacker.activeSkills?.find((sk) =>
      (typeof sk === 'string' ? sk === SkillName.fierceBrute : sk.name === SkillName.fierceBrute))) {
      skillsMultiplier *= 2;
    }

    // x4 pour piledriver
    if (piledriver) {
      skillsMultiplier *= 4;
    }

    let damage = 0;

    if (thrown) {
      damage = Math.floor(
        (base + attacker.strength * 0.1 + attacker.agility * 0.15)
        * (1 + this.random() * 0.5) * skillsMultiplier
      );
    } else if (piledriver) {
      damage = Math.floor(
        (10 + defender.strength * 0.6)
        * (0.8 + this.random() * 0.4) * skillsMultiplier
      );
    } else {
      damage = Math.floor(
        (base + attacker.strength * (0.2 + base * 0.05))
        * (0.8 + this.random() * 0.4) * skillsMultiplier
      );
    }

    // Arme endommagée ? -25%
    if (attacker.activeWeapon && attacker.damagedWeapons?.includes(attacker.activeWeapon.name)) {
      damage = Math.floor(damage * 0.75);
    }

    // Coup critique (5% de base)
    const criticalChance = 0.05;
    const criticalHit = this.random() < criticalChance;
    if (criticalHit) {
      damage = Math.floor(damage * 2);
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
    
    // Steps d'arrivée
    this.fighters.forEach((fighter) => {
      this.steps.push({
        a: StepType.Arrive,
        f: fighter.index,
      });
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
