/**
 * LaBrute Authentic Combat Engine
 * Basé sur le code source officiel de LaBrute
 * Formules et mécaniques exactes extraites du repository officiel
 * Client-side mirror of server/combat/LaBruteEngine.js;
 * server implementation is authoritative.
 */

import constants, { LABRUTE_SKILLS } from './labrute-core/constants.js';
import Rand from 'rand-seed';
const { SkillName, StepType } = constants;

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
    this.random = new Rand(seed);
    this.steps = [];
    this.initiative = 0;
    this.turn = 0;
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
    const fighter = {
      index,
      team,
      name: stats.name || `Fighter ${index + 1}`,
      strength: stats.strength ?? 10,
      agility: stats.agility ?? 10,
      speed: stats.speed ?? 10,
      endurance: stats.endurance ?? 10,
      skills: stats.skills || [],
      weapons: stats.weapons || [],
      activeWeapon: null,
      pets: stats.pets || [],
      armor: 0,
      block: 0,
      damageReduction: 1,
      baseDamage: 5,
      damage: 5,
      stunned: false,
      trapped: false,
      immune: false,
      survival: false,
      hitBy: {},
      activeSkills: [],
      damagedWeapons: []
    };

    this.applySkillModifiers(fighter);

    const maxHpBase = 50 + fighter.endurance * 6;
    const maxHp = Math.floor(maxHpBase * (fighter.hpMultiplier || 1) + (fighter.hpAdd || 0));
    fighter.maxHp = maxHp;
    fighter.currentHp = maxHp;
    fighter.hp = maxHp;

    fighter.baseDamage = Math.floor(fighter.baseDamage * (fighter.bareHandsDamageMultiplier || 1) + (fighter.bareHandsDamageAdd || 0));
    fighter.damage = fighter.baseDamage;

    fighter.initiative = fighter.agility * 0.6 + fighter.speed * 0.4;
    if (fighter.initiativeMultiplier) fighter.initiative *= fighter.initiativeMultiplier;
    if (fighter.initiativeAdd) fighter.initiative += fighter.initiativeAdd;

    return fighter;
  }

  /**
   * Applique les modificateurs des compétences
   */
  applySkillModifiers(fighter) {
    fighter.skills.forEach((sk) => {
      const skillName = typeof sk === 'string' ? sk : sk.name;
      const data = LABRUTE_SKILLS[skillName];
      if (!data || !data.modifiers) return;

      Object.entries(data.modifiers).forEach(([key, mod]) => {
        if (mod === undefined || mod === null) return;
        if (typeof mod === 'object') {
          if (['strength', 'agility', 'speed', 'endurance'].includes(key)) {
            if (mod.multiply !== undefined) fighter[key] *= mod.multiply;
            if (mod.add !== undefined) fighter[key] += mod.add;
          } else if (key === 'hp') {
            if (mod.multiply !== undefined) fighter.hpMultiplier = (fighter.hpMultiplier || 1) * mod.multiply;
            if (mod.add !== undefined) fighter.hpAdd = (fighter.hpAdd || 0) + mod.add;
          } else if (key === 'initiative') {
            if (mod.multiply !== undefined) fighter.initiativeMultiplier = (fighter.initiativeMultiplier || 1) * mod.multiply;
            if (mod.add !== undefined) fighter.initiativeAdd = (fighter.initiativeAdd || 0) + mod.add;
          } else if (key === 'bareHandsDamage') {
            if (mod.multiply !== undefined) fighter.bareHandsDamageMultiplier = (fighter.bareHandsDamageMultiplier || 1) * mod.multiply;
            if (mod.add !== undefined) fighter.bareHandsDamageAdd = (fighter.bareHandsDamageAdd || 0) + mod.add;
          } else if (key === 'weaponDamage') {
            if (mod.multiply !== undefined) fighter.weaponDamageMultiplier = (fighter.weaponDamageMultiplier || 1) * mod.multiply;
            if (mod.add !== undefined) fighter.weaponDamageAdd = (fighter.weaponDamageAdd || 0) + mod.add;
          } else {
            const isMultiplier = key.toLowerCase().includes('damage') || key.toLowerCase().includes('reduction') || key.toLowerCase().includes('multiplier');
            if (fighter[key] === undefined) fighter[key] = isMultiplier ? 1 : 0;
            if (mod.multiply !== undefined) fighter[key] *= mod.multiply;
            if (mod.add !== undefined) fighter[key] += mod.add;
          }
        } else {
          fighter[key] = mod;
        }
      });
    });
  }

  /**
   * Calcule les dégâts selon les formules officielles LaBrute
   */
  getDamage(attacker, defender, thrown = null) {
    const base = thrown
      ? thrown.damage
      : (attacker.activeWeapon?.damage || attacker.baseDamage);

    const piledriver = attacker.activeSkills?.find((sk) =>
      (typeof sk === 'string' ? sk === SkillName.hammer : sk.name === SkillName.hammer));

    let skillsMultiplier = attacker.damageMultiplier || 1;

    if (thrown) {
      skillsMultiplier *= attacker.thrownDamageMultiplier || 1;
    } else if (attacker.activeWeapon) {
      skillsMultiplier *= attacker.weaponDamageMultiplier || 1;
      attacker.activeWeapon.types?.forEach((t) => {
        const key = `${t}WeaponDamageMultiplier`;
        if (attacker[key]) skillsMultiplier *= attacker[key];
      });
    } else {
      skillsMultiplier *= attacker.bareHandsDamageMultiplier || 1;
    }

    if (defender.damageReduction) skillsMultiplier *= defender.damageReduction;
    if (!thrown && attacker.activeWeapon?.types && defender.heavyWeaponReduction) {
      if (attacker.activeWeapon.types.includes('heavy') || attacker.activeWeapon.types.includes('melee')) {
        skillsMultiplier *= defender.heavyWeaponReduction;
      }
    }

    if (attacker.activeSkills?.find((sk) =>
      (typeof sk === 'string' ? sk === SkillName.fierceBrute : sk.name === SkillName.fierceBrute))) {
      skillsMultiplier *= 2;
    }

    if (piledriver) {
      skillsMultiplier *= 4;
    }

    let damage = 0;

    if (thrown) {
      damage = Math.floor(
        (base + attacker.strength * 0.1 + attacker.agility * 0.15)
        * (1 + this.random.next() * 0.5) * skillsMultiplier
      );
    } else if (piledriver) {
      damage = Math.floor(
        (10 + defender.strength * 0.6)
        * (0.8 + this.random.next() * 0.4) * skillsMultiplier
      );
    } else {
      damage = Math.floor(
        (base + attacker.strength * (0.2 + base * 0.05))
        * (0.8 + this.random.next() * 0.4) * skillsMultiplier
      );
    }

    if (attacker.activeWeapon && attacker.damagedWeapons?.includes(attacker.activeWeapon.name)) {
      damage = Math.floor(damage * 0.75);
    }

    const criticalChance = 0.05 + (attacker.critChance || 0) / 100;
    const criticalHit = this.random.next() < criticalChance;
    if (criticalHit) {
      damage = Math.floor(damage * 2);
    }

    if (!thrown) {
      damage = Math.ceil(damage - (defender.armor || 0));
    }

    if (damage < 1) {
      damage = 1;
    }

    return { damage, criticalHit };
  }

  /**
   * Détermine qui joue en premier
   */
  determineFirstFighter() {
    const f1Initiative = this.fighters[0].initiative + this.random.next() * 10;
    const f2Initiative = this.fighters[1].initiative + this.random.next() * 10;
    
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
