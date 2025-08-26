/**
 * OFFICIAL LABRUTE STAT CALCULATION
 * Get fighter stats with modifiers
 */

const { FightStat } = require('./constants');

/**
 * Get a fighter stat value with all modifiers applied
 */
function getFighterStat(fighter, stat) {
  let value = 0;
  
  switch (stat) {
    case FightStat.STRENGTH:
    case 'STRENGTH':
      value = fighter.strength || 0;
      // Add skill modifiers
      if (fighter.skills?.includes('herculeanStrength')) {
        value += 5;
      }
      if (fighter.skills?.includes('fierceBrute')) {
        value *= 1.5;
      }
      break;
      
    case FightStat.AGILITY:
    case 'AGILITY':
      value = fighter.agility || 0;
      // Add skill modifiers
      if (fighter.skills?.includes('felineAgility')) {
        value += 5;
      }
      if (fighter.skills?.includes('balletShoes')) {
        value += 3;
      }
      break;
      
    case FightStat.SPEED:
    case 'SPEED':
      value = fighter.speed || 0;
      // Add skill modifiers
      if (fighter.skills?.includes('lightningBolt')) {
        value += 5;
      }
      if (fighter.skills?.includes('haste')) {
        value *= 1.3;
      }
      break;
      
    case FightStat.CRITICAL_CHANCE:
    case 'CRITICAL_CHANCE':
      value = 0.1; // Base 10% crit chance
      // Add weapon crit chance
      if (fighter.activeWeapon?.criticalChance) {
        value += fighter.activeWeapon.criticalChance;
      }
      // Add skill modifiers
      if (fighter.skills?.includes('sixthSense')) {
        value += 0.2;
      }
      break;
      
    case FightStat.CRITICAL_DAMAGE:
    case 'CRITICAL_DAMAGE':
      value = 2.0; // Base 2x crit damage
      // Add skill modifiers
      if (fighter.skills?.includes('fierceBrute')) {
        value += 0.5;
      }
      break;
      
    case FightStat.EVASION:
    case 'EVASION':
      value = 0.1; // Base 10% evasion
      // Add agility bonus
      value += fighter.agility * 0.01;
      // Add weapon evasion
      if (fighter.activeWeapon?.evasion) {
        value += fighter.activeWeapon.evasion;
      }
      // Add skill modifiers
      if (fighter.skills?.includes('untouchable')) {
        value += 0.3;
      }
      break;
      
    case FightStat.ACCURACY:
    case 'ACCURACY':
      value = 0.5; // Base 50% accuracy
      // Add weapon accuracy
      if (fighter.activeWeapon?.accuracy) {
        value += fighter.activeWeapon.accuracy;
      }
      // Add skill modifiers
      if (fighter.skills?.includes('sixthSense')) {
        value += 0.2;
      }
      break;
      
    case FightStat.BLOCK:
    case 'BLOCK':
      value = 0.1; // Base 10% block
      // Add weapon block
      if (fighter.activeWeapon?.block) {
        value += fighter.activeWeapon.block;
      }
      // Add skill modifiers
      if (fighter.skills?.includes('shield')) {
        value += 0.25;
      }
      break;

    case FightStat.DEXTERITY:
    case 'DEXTERITY':
    case 'dexterity':
      value = fighter.activeWeapon?.dexterity || 0;
      // Bodybuilder bonus with heavy weapons
      if (fighter.skills?.includes('bodybuilder') && fighter.activeWeapon?.types?.includes('heavy')) {
        value += 0.1;
      }
      break;
      
    case FightStat.ARMOR:
    case 'ARMOR':
      value = fighter.armor || 0;
      break;
      
    case FightStat.INITIATIVE:
    case 'INITIATIVE':
      value = fighter.speed;
      // Add weapon tempo
      if (fighter.activeWeapon?.tempo) {
        value += fighter.activeWeapon.tempo * 10;
      }
      break;
      
    case FightStat.COUNTER:
    case 'COUNTER':
      value = 0;
      // Add skill modifiers
      if (fighter.skills?.includes('counterAttack')) {
        value = 0.3;
      }
      break;
      
    default:
      value = 0;
  }
  
  return value;
}

module.exports = { getFighterStat };