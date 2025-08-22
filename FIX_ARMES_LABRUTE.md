# 🔧 CORRECTIFS ARMES - MOTEUR LABRUTE OFFICIEL

## PROBLÈMES IDENTIFIÉS

1. **L'arme se détache du personnage** pendant les mouvements (esquive, etc.)
2. **Fréquence de lancer incorrecte** - ne suit pas la formule officielle
3. **Pas d'attaque à mains nues** avec une arme (devrait être 10% - NO_WEAPON_TOSS)
4. **Armes "thrown" perdues** alors qu'elles devraient être gardées

## SOLUTIONS IMPLÉMENTÉES

### 1. Synchronisation des armes
```javascript
// TOUJOURS vérifier hasWeapon ET weaponSprite
if (f.weaponSprite && f.hasWeapon && !f.weaponThrown) {
  const xOffset = f.side === 'left' ? 25 : -25;
  f.weaponSprite.x = f.sprite.x + xOffset;
  f.weaponSprite.y = f.sprite.y - 80;
  f.weaponSprite.setDepth(f.sprite.depth + 1);
}
```

### 2. Formule officielle de lancer
```javascript
// FORMULE OFFICIELLE LABRUTE
function calculateThrowChance(weapon) {
  const labruteWeapon = LABRUTE_WEAPONS[weapon];
  
  // Armes "thrown" (shuriken, piopio, noodleBowl)
  if (labruteWeapon.types.includes('thrown')) {
    return 0.5; // 50% de chance
  }
  
  // Autres armes : 1/(33 - tempo*5)
  const tempo = labruteWeapon.tempo || 1.2;
  return 1 / Math.max(10, 33 - tempo * 5);
}
```

### 3. Décision d'action complète
```javascript
// MÉCANIQUES OFFICIELLES
const NO_WEAPON_TOSS = 0.1; // 10% chance mains nues avec arme

function decideAction(fighter) {
  if (!fighter.hasWeapon) return 'bareHands';
  
  const throwChance = calculateThrowChance(fighter.weaponType);
  const roll = Math.random();
  
  if (roll < throwChance) {
    return 'throw';
  } else if (roll < throwChance + NO_WEAPON_TOSS) {
    return 'bareHands'; // Attaque à mains nues même avec arme!
  } else {
    return 'weapon';
  }
}
```

### 4. Armes "thrown" gardées après lancer
```javascript
// ARMES QUI RESTENT (types: ['thrown'])
const KEPT_WEAPONS = ['shuriken', 'piopio', 'noodleBowl'];

// Après le lancer
if (KEPT_WEAPONS.includes(attacker.weaponType)) {
  // Créer une COPIE pour l'animation
  const projectile = createProjectileCopy(attacker.weaponSprite);
  animateProjectile(projectile, target);
  
  // L'attaquant GARDE son arme
  attacker.hasWeapon = true;
} else {
  // Arme normale - elle est perdue
  animateAndDestroy(attacker.weaponSprite);
  attacker.hasWeapon = false;
  attacker.weaponThrown = true;
}
```

## EXEMPLES DE CHANCES DE LANCER

| Arme | Tempo | Chance de lancer |
|------|-------|------------------|
| shuriken | 0.12 | 50% (thrown) |
| piopio | 0.32 | 50% (thrown) |
| noodleBowl | 0.45 | 50% (thrown) |
| fan | 0.28 | ~3.5% |
| knife | 0.6 | ~4% |
| sword | 1.8 | ~3.8% |
| axe | 2.3 | ~4.8% |
| trombone | 2.5 | ~5.5% |

## ACTIONS REQUISES

1. ✅ Créé `FightWeaponFixes.js` avec toutes les mécaniques
2. ⚠️ Importer et utiliser `WeaponSystem` dans `FightSceneSpine.js`
3. ⚠️ Remplacer les décisions d'action par `WeaponSystem.decideAction()`
4. ⚠️ Utiliser `WeaponSystem.syncWeaponPosition()` dans tous les tweens

## RÉSULTAT ATTENDU

- Les armes restent collées aux personnages
- Fréquence de lancer réaliste (3-5% pour armes normales, 50% pour projectiles)
- 10% d'attaques à mains nues même avec une arme
- Les shurikens et autres projectiles ne sont pas perdus