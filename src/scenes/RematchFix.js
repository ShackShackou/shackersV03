// CORRECTIF POUR LA FONCTION REMATCH

export function setupRematchButton(scene, btnX, btnY) {
  const rematchBtn = scene.add.text(btnX, btnY, '[ Rematch ]', { 
    fontSize: '20px', 
    color: '#00ccff' 
  })
  .setOrigin(0.5)
  .setInteractive({ useHandCursor: true })
  .on('pointerup', () => {
    console.log('=== REMATCH DÉCLENCHÉ ===');
    
    // 1. NETTOYAGE COMPLET DE LA SCÈNE
    cleanupScene(scene);
    
    // 2. RÉCUPÉRATION DES STATS INITIALES
    const freshStats = getFreshStats(scene);
    
    if (!freshStats.a || !freshStats.b) {
      console.error('Erreur: Impossible de récupérer les stats initiales pour le rematch');
      return;
    }
    
    console.log('Stats réinitialisées pour rematch:', freshStats);
    
    // 3. REDÉMARRAGE DE LA SCÈNE
    scene.scene.restart({ 
      a: freshStats.a, 
      b: freshStats.b,
      background: scene.initialBackground // Garder le même décor
    });
  });
  
  return rematchBtn;
}

function cleanupScene(scene) {
  console.log('Nettoyage de la scène...');
  
  // 1. Arrêter toutes les animations
  scene.tweens.killAll();
  scene.time.removeAllEvents();
  
  // 2. Nettoyer le fond si nécessaire
  scene.isUsingGifBackground = false;
  
  // 3. Détruire les sprites d'armes
  [scene.fighter1, scene.fighter2].forEach(fighter => {
    if (fighter) {
      if (fighter.weaponSprite) {
        fighter.weaponSprite.destroy();
        fighter.weaponSprite = null;
      }
      if (fighter.weaponText) {
        fighter.weaponText.destroy();
        fighter.weaponText = null;
      }
    }
  });
  
  // 4. Détruire les sprites de combattants
  [scene.fighter1, scene.fighter2].forEach(fighter => {
    if (fighter) {
      if (fighter.sprite) {
        fighter.sprite.destroy();
        fighter.sprite = null;
      }
      if (fighter.shadow) {
        fighter.shadow.destroy();
        fighter.shadow = null;
      }
      if (fighter.petSprite) {
        fighter.petSprite.destroy();
        fighter.petSprite = null;
      }
      if (fighter.petText) {
        fighter.petText.destroy();
        fighter.petText = null;
      }
    }
  });
  
  // 5. Nettoyer l'UI
  if (scene.ui) {
    Object.values(scene.ui).forEach(element => {
      if (element && element.destroy) {
        element.destroy();
      }
    });
    scene.ui = null;
  }
  
  // 6. Réinitialiser les états de combat
  scene.combatOver = false;
  scene.turnInProgress = false;
  scene.stopCombat = false;
  scene.animationsComplete = true;
  
  console.log('Nettoyage terminé');
}

function getFreshStats(scene) {
  // Créer des copies profondes des stats initiales
  const freshA = scene.initialA ? JSON.parse(JSON.stringify(scene.initialA)) : null;
  const freshB = scene.initialB ? JSON.parse(JSON.stringify(scene.initialB)) : null;
  
  // Réinitialiser les HP et stamina au maximum
  if (freshA) {
    freshA.health = freshA.maxHealth || freshA.health;
    freshA.stamina = freshA.maxStamina || freshA.stamina || 100;
    freshA.initiative = 0;
    
    // Réinitialiser l'état de l'arme
    if (freshA.weapon) {
      freshA.hasWeapon = true;
      freshA.weaponType = freshA.weapon;
      freshA.weapons = [freshA.weapon];
    } else {
      freshA.hasWeapon = false;
      freshA.weaponType = null;
      freshA.weapons = [];
    }
    freshA.weaponThrown = false;
    
    // Réinitialiser les skills actifs
    freshA.activeSkills = [];
    freshA.specialMoves = { unlocked: [], active: {} };
  }
  
  if (freshB) {
    freshB.health = freshB.maxHealth || freshB.health;
    freshB.stamina = freshB.maxStamina || freshB.stamina || 100;
    freshB.initiative = 0;
    
    // Réinitialiser l'état de l'arme
    if (freshB.weapon) {
      freshB.hasWeapon = true;
      freshB.weaponType = freshB.weapon;
      freshB.weapons = [freshB.weapon];
    } else {
      freshB.hasWeapon = false;
      freshB.weaponType = null;
      freshB.weapons = [];
    }
    freshB.weaponThrown = false;
    
    // Réinitialiser les skills actifs
    freshB.activeSkills = [];
    freshB.specialMoves = { unlocked: [], active: {} };
  }
  
  return { a: freshA, b: freshB };
}

// Fonction pour sauvegarder les stats initiales au début du combat
export function saveInitialStats(scene, statsA, statsB) {
  // Sauvegarder SEULEMENT si pas déjà fait (pour éviter d'écraser lors d'un rematch)
  if (!scene.originalStatsA) {
    scene.originalStatsA = JSON.parse(JSON.stringify(statsA));
  }
  if (!scene.originalStatsB) {
    scene.originalStatsB = JSON.parse(JSON.stringify(statsB));
  }
  
  // Toujours mettre à jour les stats initiales pour le rematch actuel
  scene.initialA = JSON.parse(JSON.stringify(statsA));
  scene.initialB = JSON.parse(JSON.stringify(statsB));
}

// Export des fonctions utilitaires
export default {
  setupRematchButton,
  cleanupScene,
  getFreshStats,
  saveInitialStats
};