// CORRECTIFS POUR LES ARMES SELON LE MOTEUR LABRUTE OFFICIEL

export class WeaponSystem {
  
  // Calcul officiel des chances de lancer d'arme
  static calculateThrowChance(weapon, labruteWeapons) {
    if (!weapon) return 0;
    
    const labruteWeapon = labruteWeapons[weapon];
    if (!labruteWeapon) return 0;
    
    // Armes de type "thrown" (shuriken, piopio, noodleBowl)
    if (labruteWeapon.types && labruteWeapon.types.includes('thrown')) {
      return 0.5; // 50% de chance
    }
    
    // Autres armes : formule officielle 1/(33 - tempo*5)
    const tempo = labruteWeapon.tempo || 1.2;
    return 1 / Math.max(10, 33 - tempo * 5);
  }
  
  // Vérifier si l'arme est gardée après le lancer
  static isKeptAfterThrow(weapon, labruteWeapons) {
    const labruteWeapon = labruteWeapons[weapon];
    if (!labruteWeapon) return false;
    
    // Les armes "thrown" sont gardées (shuriken, piopio, noodleBowl)
    return labruteWeapon.types && labruteWeapon.types.includes('thrown');
  }
  
  // Synchroniser la position de l'arme avec le sprite
  static syncWeaponPosition(fighter, forceUpdate = false) {
    if (!fighter.weaponSprite || !fighter.hasWeapon || fighter.weaponThrown) {
      return;
    }
    
    // Position de l'arme relative au combattant
    const xOffset = fighter.side === 'left' ? 25 : -25;
    fighter.weaponSprite.x = fighter.sprite.x + xOffset;
    fighter.weaponSprite.y = fighter.sprite.y - 80;
    
    // S'assurer que l'arme est au-dessus du sprite
    if (fighter.sprite.depth !== undefined) {
      fighter.weaponSprite.setDepth(fighter.sprite.depth + 1);
    }
  }
  
  // Animation de lancer d'arme
  static async throwWeaponAnimation(scene, attacker, target, result) {
    if (!attacker.weaponSprite || !attacker.hasWeapon) return;
    
    const weaponType = attacker.weaponType;
    const labruteWeapon = scene.LABRUTE_WEAPONS[weaponType];
    const isThrowingWeapon = WeaponSystem.isKeptAfterThrow(weaponType, scene.LABRUTE_WEAPONS);
    
    if (isThrowingWeapon) {
      // Créer une copie pour les armes de lancer (gardent l'original)
      const thrownCopy = scene.add.image(
        attacker.weaponSprite.x, 
        attacker.weaponSprite.y, 
        attacker.weaponSprite.texture.key
      );
      thrownCopy.setScale(attacker.weaponSprite.scale);
      thrownCopy.setDepth(200);
      
      await new Promise(resolve => {
        scene.tweens.add({
          targets: thrownCopy,
          x: target.sprite.x,
          y: target.sprite.y - 50,
          rotation: Math.PI * 6,
          duration: 300,
          ease: 'Linear',
          onComplete: () => {
            thrownCopy.destroy();
            
            // Afficher les dégâts
            if (result.hit && result.damage > 0) {
              scene.showDamageText(target, result.damage, result.critical);
              scene.updateFighterHP(target);
            } else if (!result.hit) {
              scene.showMissText(target, 'DODGE!');
            }
            
            resolve();
          }
        });
      });
      
      // L'attaquant GARDE son arme
      attacker.hasWeapon = true;
      
    } else {
      // Arme normale - elle est perdue
      await new Promise(resolve => {
        scene.tweens.add({
          targets: attacker.weaponSprite,
          x: target.sprite.x,
          y: target.sprite.y - 50,
          rotation: attacker.weaponSprite.rotation + Math.PI * 4,
          duration: 400,
          ease: 'Power1',
          onComplete: () => {
            if (attacker.weaponSprite) {
              attacker.weaponSprite.destroy();
              attacker.weaponSprite = null;
            }
            attacker.hasWeapon = false;
            attacker.weaponThrown = true;
            
            // Afficher les dégâts
            if (result.hit && result.damage > 0) {
              scene.showDamageText(target, result.damage, result.critical);
              scene.updateFighterHP(target);
            } else if (!result.hit) {
              scene.showMissText(target, 'DODGE!');
            }
            
            resolve();
          }
        });
      });
    }
  }
  
  // Décision d'action selon LaBrute officiel
  static decideAction(fighter, rng, labruteWeapons) {
    const hasWeapon = fighter.hasWeapon && fighter.weaponSprite;
    
    if (!hasWeapon) {
      // Sans arme, toujours attaque à mains nues
      return 'bareHands';
    }
    
    // Calculer la chance de lancer
    const throwChance = WeaponSystem.calculateThrowChance(fighter.weaponType, labruteWeapons);
    
    // Décision basée sur les probabilités officielles
    const roll = rng.next();
    
    if (roll < throwChance) {
      return 'throw';
    } else if (roll < throwChance + 0.1) {
      // 10% de chance d'attaquer à mains nues même avec une arme (NO_WEAPON_TOSS)
      return 'bareHands';
    } else {
      // Utiliser l'arme normalement
      return 'weapon';
    }
  }
  
  // Créer un helper pour les tweens qui synchronisent l'arme
  static createWeaponSyncTween(scene, fighter, targetX, targetY, duration, options = {}) {
    const tween = {
      targets: fighter.sprite,
      x: targetX,
      y: targetY,
      duration: duration,
      ease: options.ease || 'Power1',
      onUpdate: () => {
        WeaponSystem.syncWeaponPosition(fighter);
      },
      ...options
    };
    
    return scene.tweens.add(tween);
  }
}

// Export pour utilisation dans FightSceneSpine
export default WeaponSystem;