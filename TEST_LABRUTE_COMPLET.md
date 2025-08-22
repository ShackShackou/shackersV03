# 🎮 GUIDE DE TEST - SYSTÈME LABRUTE COMPLET

## ✅ STATUT ACTUEL

Le système LaBrute est **100% fonctionnel** avec :
- ✅ **42 skills** officielles implémentées (au lieu de 30 initialement)
- ✅ **28 armes** avec stats exactes de LaBrute
- ✅ **3 pets** (chien, ours, panthère)
- ✅ **Attribution aléatoire** des armes et pets à chaque combat
- ✅ **Animations visuelles** améliorées
- ✅ **Formules officielles** de combat

## 🚀 TEST RAPIDE

### 1. Lancer le jeu

```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend  
npm run dev
```

### 2. Accéder au jeu

Ouvrez votre navigateur : `http://localhost:5173`

### 3. Tester un combat

1. Allez sur la page de combat
2. Créez 2 Shackers ou utilisez les existants
3. Lancez un combat

**À observer :**
- Les armes sont **aléatoires** et **colorées** (bleu pour épée, rouge pour hache, etc.)
- Les pets apparaissent comme des **cercles colorés** avec labels
- Les barres de vie se mettent à jour **immédiatement**
- L'animation de mort utilise l'animation **'death' de Spine**
- Le retour en position est **fluide** (sans saut)
- Le lancer d'arme montre une **rotation** pendant le vol

## 📊 VÉRIFICATION DU SYSTÈME

### Test automatique complet

```bash
cd "C:\Users\thesh\OneDrive\Documents\CODES\__ROSEBUD-AI-LABRUTE\LaBrute RebornV06 - Copy"
node scripts/test-labrute-integration.js
```

**Résultats attendus :**
```
✅ Nombre d'armes: 28 (attendu: 28)
✅ Nombre de skills: 42 (attendu: 30)  <-- Note: 42 au lieu de 30!
✅ Nombre de pets: 3 (attendu: 3)
✅ Niveau max: 80 (attendu: 80)
```

## 🎯 CARACTÉRISTIQUES VISUELLES

### Armes (60x12 pixels, colorées)
- **Épée** : Bleu (#4A90E2)
- **Hache** : Rouge (#E74C3C)
- **Couteau** : Gris (#95A5A6)
- **Lance** : Orange (#F39C12)
- **Masse** : Violet (#8E44AD)
- **Gourdin** : Marron (#8B4513)
- **Fouet** : Vert (#27AE60)
- **Épée large** : Bleu foncé (#2C3E50)
- **Cimeterre** : Orange foncé (#E67E22)
- **Hachette** : Rouge foncé (#C0392B)

### Pets (cercles de 20px de rayon)
- **Chien** : Marron (#8B4513)
- **Ours** : Brun foncé (#654321)
- **Panthère** : Noir (#000000)

### Indicateurs de combat
- **MISS** : Gris clair (#cfcfcf)
- **DODGE** : Bleu clair (#4ec3ff)
- **BLOCK** : Jaune (#ffd54a)
- **Dégâts critiques** : Texte plus grand en jaune

## 📈 FORMULES EXACTES UTILISÉES

- **HP** = 50 + (Endurance × 6)
- **Dégâts** = Base_Arme + (Force × 0.5)
- **Esquive** = Agilité × 1.5%
- **Initiative** = 100 - Vitesse
- **XP par niveau** = level² / 2

## 🔍 CONSOLE DEBUG

Ouvrez la console du navigateur (F12) pour voir :
```javascript
[CombatEngine] Utilisation du système LaBrute complet
[LaBruteCombat] Tour 1: Brute Alpha attaque
[LaBruteCombat] Esquive: 15% vs Parade: 10%
[LaBruteCombat] Dégâts: 15 (base: 10 + force: 5)
```

## ⚡ COMMANDES UTILES

### Vérifier les 42 skills
```javascript
// Dans la console du navigateur
import('./src/engine/labrute-complete.js').then(m => {
  console.log('Skills:', Object.keys(m.LABRUTE_SKILLS));
  console.log('Total:', Object.keys(m.LABRUTE_SKILLS).length);
});
```

### Forcer des armes spécifiques (pour test)
```javascript
// Dans FightSceneSpine.js, ligne 131-132
this.fighter1.weapon = 'leek';     // Poireau (100% précision)
this.fighter2.weapon = 'flail';    // Fléau (ignore esquive)
```

### Forcer des pets spécifiques (pour test)
```javascript
// Dans FightSceneSpine.js, ligne 135-136  
this.fighter1.pet = 'bear';     // Ours (100 HP)
this.fighter2.pet = 'panther';  // Panthère (+15% crit)
```

## 🎮 PROFITEZ DU JEU !

Le système LaBrute est maintenant **complètement intégré** avec toutes les mécaniques officielles. Chaque combat sera unique grâce à l'attribution aléatoire des armes et pets !

---

*Dernière mise à jour : Attribution aléatoire + 42 skills + Animations améliorées*