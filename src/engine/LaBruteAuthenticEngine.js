/**
 * LaBrute Authentic Combat Engine
 * Basé sur le code source officiel de LaBrute
 * Formules et mécaniques exactes extraites du repository officiel
 * Client-side mirror of server/combat/LaBruteEngine.js;
 * server implementation is authoritative.
 */

import constants from './labrute-core/constants.js';
import { LABRUTE_SKILLS } from './labrute-complete.js';
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
    const baseHp = 50 + (stats.endurance || 10) * 6;

    const fighter = {
      index,
      team,
      name: stats.name || `Fighter ${index + 1}`,
      hp: baseHp,
      maxHp: baseHp,
      currentHp: baseHp,
      strength: stats.strength || 10,
      agility: stats.agility || 10,
      speed: stats.speed || 10,
      endurance: stats.endurance || 10,
      // Formule initiative: calculée après application des compétences
      initiative: 0,
      skills: stats.skills || [],
      weapons: stats.weapons || [],
      activeWeapon: null,
      pets: stats.pets || [],
      armor: 0, // réduction de dégâts en pourcentage
      damage: 5, // Dégâts de base sans arme
      baseDamage: 5,
      // Statistiques additionnelles influencées par les compétences
      block: 0,
      dodge: 0,
      counter: 0,
      comboChance: 0,
      maxCombo: 1,
      critChance: 0.05,
      accuracy: 0,
      incomingDamageMultiplier: 1,
      meleeWeaponMultiplier: 1,
      weaponDamageMultiplier: 1,
      bareHandsDamageMultiplier: 1,
      stunned: false,
      trapped: false,
      immune: false,
      survival: false,
      hitBy: {},
      activeSkills: [],
      damagedWeapons: []
    };

    // Appliquer les modifications des compétences
    this.applySkillModifiers(fighter);

    // Recalculer l'initiative après application des compétences
    fighter.initiative = fighter.agility * 0.6 + fighter.speed * 0.4;

    // HP et dégâts après modifications
    fighter.maxHp = Math.floor(fighter.maxHp);
    fighter.hp = fighter.currentHp = fighter.maxHp;
    fighter.baseDamage = Math.floor(fighter.baseDamage * fighter.bareHandsDamageMultiplier);
    fighter.damage = fighter.baseDamage;

    return fighter;
  }

  /**
   * Applique les modificateurs des compétences sur un combattant
   */
  applySkillModifiers(fighter) {
    const applyStat = (stat, mod) => {
      if (typeof fighter[stat] === 'undefined') {
        fighter[stat] = 0;
      }
      if (mod.multiply !== undefined) {
        fighter[stat] *= mod.multiply;
      }
      if (mod.add !== undefined) {
        fighter[stat] += mod.add;
      }
    };

    fighter.skills.forEach((sk) => {
      const name = typeof sk === 'string' ? sk : sk.name;
      const data = LABRUTE_SKILLS[name];
      if (!data || !data.modifiers) { return; }

      for (const [key, mod] of Object.entries(data.modifiers)) {
        switch (key) {
          case 'strength':
          case 'agility':
          case 'speed':
            applyStat(key, mod);
            break;
          case 'hp':
            applyStat('maxHp', mod);
            break;
          case 'bareHandsDamage':
            if (mod.multiply !== undefined) {
              fighter.bareHandsDamageMultiplier *= mod.multiply;
            }
            if (mod.add !== undefined) {
              fighter.baseDamage += mod.add;
            }
            break;
          case 'weaponDamage':
            if (mod.multiply !== undefined) {
              fighter.weaponDamageMultiplier *= mod.multiply;
            }
            break;
          case 'block':
            if (mod.multiply !== undefined) {
              fighter.block *= mod.multiply;
            }
            if (mod.add !== undefined) {
              fighter.block += mod.add / 100;
            }
            break;
          case 'armor':
            if (mod.multiply !== undefined) {
              fighter.armor *= mod.multiply;
            }
            if (mod.add !== undefined) {
              fighter.armor += (mod.add / 100);
            }
            break;
          case 'damageReduction':
            if (mod.multiply !== undefined) {
              fighter.incomingDamageMultiplier *= mod.multiply;
            }
            if (mod.add !== undefined) {
              fighter.incomingDamageMultiplier *= (1 - mod.add / 100);
            }
            break;
          case 'dodge':
            if (mod.multiply !== undefined) {
              fighter.dodge *= mod.multiply;
            }
            if (mod.add !== undefined) {
              fighter.dodge += mod.add / 100;
            }
            break;
          case 'heavyWeaponReduction':
            if (mod.multiply !== undefined) {
              fighter.meleeWeaponMultiplier *= mod.multiply;
            }
            if (mod.add !== undefined) {
              fighter.meleeWeaponMultiplier *= (1 - mod.add / 100);
            }
            break;
          case 'counter':
            if (mod.multiply !== undefined) {
              fighter.counter *= mod.multiply;
            }
            if (mod.add !== undefined) {
              fighter.counter += mod.add / 100;
            }
            break;
          case 'comboChance':
            if (mod.multiply !== undefined) {
              fighter.comboChance *= mod.multiply;
            }
            if (mod.add !== undefined) {
              fighter.comboChance += mod.add / 100;
            }
            break;
          case 'maxCombo':
            if (mod.multiply !== undefined) {
              fighter.maxCombo = Math.floor(fighter.maxCombo * mod.multiply);
            }
            if (mod.add !== undefined) {
              fighter.maxCombo += mod.add;
            }
            break;
          case 'critChance':
            if (mod.multiply !== undefined) {
              fighter.critChance *= mod.multiply;
            }
            if (mod.add !== undefined) {
              fighter.critChance += mod.add / 100;
            }
            break;
          case 'accuracy':
            if (mod.multiply !== undefined) {
              fighter.accuracy *= mod.multiply;
            }
            if (mod.add !== undefined) {
              fighter.accuracy += mod.add / 100;
            }
            break;
        }
      }
    });
  }

  /**
   * Calcule les dégâts selon les formules officielles LaBrute
   */
  getDamage(attacker, defender, thrown = null) {
    const base = thrown
      ? thrown.damage
      : (attacker.activeWeapon?.damage || attacker.baseDamage);

    // Piledriver actif ?
    const piledriver = attacker.activeSkills?.find((sk) =>
      (typeof sk === 'string' ? sk === SkillName.hammer : sk.name === SkillName.hammer));

    let damage = 0;

    if (thrown) {
      damage = (base + attacker.strength * 0.1 + attacker.agility * 0.15)
        * (1 + this.random() * 0.5);
    } else if (piledriver) {
      damage = (10 + defender.strength * 0.6)
        * (0.8 + this.random() * 0.4);
    } else {
      damage = (base + attacker.strength * (0.2 + base * 0.05))
        * (0.8 + this.random() * 0.4);
    }

    // Multiplicateurs cumulés
    let multiplier = 1;
    multiplier *= attacker.activeWeapon ? attacker.weaponDamageMultiplier : attacker.bareHandsDamageMultiplier;
    multiplier *= defender.incomingDamageMultiplier;
    if (!thrown && attacker.activeWeapon?.types?.includes('melee')) {
      multiplier *= defender.meleeWeaponMultiplier;
    }
    if (attacker.activeSkills?.find((sk) =>
      (typeof sk === 'string' ? sk === SkillName.fierceBrute : sk.name === SkillName.fierceBrute))) {
      multiplier *= 2;
    }
    if (piledriver) {
      multiplier *= 4;
    }

    damage = Math.floor(damage * multiplier);

    // Arme endommagée ? -25%
    if (attacker.activeWeapon && attacker.damagedWeapons?.includes(attacker.activeWeapon.name)) {
      damage = Math.floor(damage * 0.75);
    }

    // Coup critique
    const criticalChance = attacker.critChance || 0.05;
    const criticalHit = this.random() < criticalChance;
    if (criticalHit) {
      damage = Math.floor(damage * 2);
    }

    // Réduction par l'armure (sauf pour les armes lancées)
    if (!thrown && defender.armor) {
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

    let comboHits = 0;
    let continueCombo = true;

    while (continueCombo && comboHits < fighter.maxCombo && opponent.hp > 0) {
      // Vérifier la parade
      if (this.random() < Math.max(0, opponent.block - fighter.accuracy)) {
        this.steps.push({ a: StepType.Block, f: opponent.index, t: fighter.index });
        // Contre après parade
        if (this.random() < opponent.counter) {
          this.performCounter(opponent, fighter);
          if (fighter.hp <= 0) { return false; }
        }
        break;
      }

      // Vérifier l'esquive
      if (this.random() < Math.max(0, opponent.dodge - fighter.accuracy)) {
        this.steps.push({ a: StepType.Evade, f: opponent.index, t: fighter.index });
        if (this.random() < opponent.counter) {
          this.performCounter(opponent, fighter);
          if (fighter.hp <= 0) { return false; }
        }
        break;
      }

      // Dégâts
      const { damage, criticalHit } = this.getDamage(fighter, opponent);

      opponent.hp -= damage;
      opponent.currentHp = opponent.hp;

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

      // Mort de l'adversaire ?
      if (opponent.hp <= 0) {
        opponent.hp = 0;
        opponent.currentHp = 0;

        this.steps.push({ a: StepType.Death, f: opponent.index });

        return false;
      }

      // Contre-attaque après avoir été touché
      if (this.random() < opponent.counter) {
        this.performCounter(opponent, fighter);
        if (fighter.hp <= 0) { return false; }
      }

      comboHits++;
      if (comboHits < fighter.maxCombo && this.random() < fighter.comboChance) {
        continueCombo = true;
      } else {
        continueCombo = false;
      }
    }

    return true; // Combat continue
  }

  /**
   * Applique une contre-attaque
   */
  performCounter(defender, attacker) {
    const { damage, criticalHit } = this.getDamage(defender, attacker);
    attacker.hp -= damage;
    attacker.currentHp = attacker.hp;

    const counterStep = {
      a: StepType.Counter,
      f: defender.index,
      t: attacker.index,
      d: damage
    };
    if (criticalHit) { counterStep.c = 1; }
    if (defender.activeWeapon) {
      counterStep.w = defender.activeWeapon.id || defender.activeWeapon.name;
    }
    this.steps.push(counterStep);

    if (attacker.hp <= 0) {
      attacker.hp = 0;
      attacker.currentHp = 0;
      this.steps.push({ a: StepType.Death, f: attacker.index });
    }
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
