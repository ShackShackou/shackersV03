# 🎮 PLAN D'ACTION - INTÉGRATION LABRUTE AUTHENTIQUE

## 🎯 OBJECTIF PRINCIPAL
Créer un clone 100% fidèle de LaBrute en combinant :
- Le moteur de rendu Phaser/Spine existant (V08) - **À PRÉSERVER ABSOLUMENT**
- Le moteur de combat authentique LaBrute (V10)
- Les données officielles du jeu original
- Une architecture MMO compétitive

## ⚠️ ÉLÉMENTS CRITIQUES À PRÉSERVER (V08)

### Moteur de Rendu Phaser/Spine
- **Taille des personnages** : Conserver les proportions actuelles
- **Animations Spine** : Tous les fichiers .atlas, .json, .png dans assets/spine/
- **Système de déplacement libre** : Les combattants doivent bouger naturellement
- **Décors dynamiques** : 
  - assets/images/backgrounds/
  - assets/images/arenas/
  - Système de sélection aléatoire des arènes
- **Effets visuels des armes** : Animations d'attaque existantes
- **Barres de vie** : Style visuel actuel avec scaling approprié
- **Interface utilisateur** : Layout responsive et scaling automatique

### Architecture de Rendu (Ne PAS modifier)
```javascript
// FightSceneSpine.js - Structure à conserver :
- Système de caméra dynamique
- Gestion des animations Spine
- Pipeline de rendu des décors
- Système de particules et effets
- Scaling et positionnement des fighters
```

## 📋 PHASES D'INTÉGRATION

### PHASE 1 : Import du Moteur de Combat (Jours 1-2)
**But** : Intégrer le vrai moteur LaBrute SANS toucher au rendu

1. **Copier depuis V10** :
   - `labrute-complete.js` → Moteur de combat complet
   - `fight-manager.js` → Gestion des combats
   - `hp-manager.js` → Synchronisation HP
   - `skill-handler.js` → Système de compétences

2. **Adapter l'interface** :
   - Créer un pont entre le moteur et FightSceneSpine
   - Mapper les steps du moteur vers les animations Spine
   - NE PAS modifier la logique de rendu existante

3. **Points d'intégration** :
   ```javascript
   // Dans FightSceneSpine.js
   - Remplacer uniquement la logique de combat
   - Garder TOUTE la partie visuelle intacte
   - Connecter les events du moteur aux animations
   ```

### PHASE 2 : Import des Données Officielles (Jours 3-5)

1. **Armes (28 au total)** :
   ```javascript
   // Remplacer weapons.js avec les vraies stats
   - damage, tempo, accuracy, combo
   - Garder les animations d'armes existantes
   ```
   
   **INTÉGRATION VISUELLE DES ARMES** :
   - Mapper chaque arme à une animation Spine
   - Afficher l'arme pendant l'attaque (overlay ou effet)
   - Sons d'impact spécifiques par arme
   - Effets visuels (slash pour épée, impact pour marteau, etc.)
   - Projectiles pour armes à distance (lance, shuriken)

2. **Skills (55 au total)** :
   ```javascript
   // Remplacer skills.js avec les vrais modificateurs
   - Effets passifs et actifs
   - Formules de calcul exactes
   ```
   
   **EFFETS VISUELS DES SKILLS** :
   - Flash pour "Flash Flood" 
   - Effet de soin pour "Regeneration"
   - Aura pour "Haste"
   - Explosion pour "Bomb"
   - Poison (teinte verte + particules)

3. **Pets (Dog, Bear, Panther)** :
   - Stats officielles (HP, damage, initiative)
   - **RENDU DES PETS** :
     * Position à côté du maître
     * Animations d'attaque propres
     * Déplacements indépendants
     * Barres de vie séparées
     * Mort animée du pet
   - IA de combat authentique

## 🎮 SYSTÈME DE PROGRESSION ET ÉQUILIBRAGE

### Distribution des Stats (Système LaBrute Authentique)
```javascript
// Stats de base par niveau
Level 1: 60 HP, 2-4 Force, 2-4 Agilité, 2-4 Rapidité
Level 10: 110 HP, 10-15 Force, 10-15 Agilité, 10-15 Rapidité
Level 20: 200 HP, 20-30 Force, 20-30 Agilité, 20-30 Rapidité

// Points bonus par niveau
+1 skill tous les 3 niveaux
+1 arme tous les 5 niveaux
+1 pet possible au niveau 10
```

### Profils de Test Équilibrés
**BRUTE TYPE "TANK" (Level 10)**
- HP: 150 (bonus endurance)
- Force: 18, Agilité: 8, Rapidité: 10
- Skills: Armor, Survival, Resistant
- Arme: Marteau (high damage, slow)
- Pet: Ours (tanky)

**BRUTE TYPE "RAPIDE" (Level 10)**
- HP: 90
- Force: 8, Agilité: 18, Rapidité: 15
- Skills: Haste, Counter, Dodge
- Arme: Dague (fast attacks)
- Pet: Panthère (agile)

**BRUTE TYPE "ÉQUILIBRÉ" (Level 10)**
- HP: 110
- Force: 12, Agilité: 12, Rapidité: 12
- Skills: Block, Regeneration, Accuracy
- Arme: Épée (balanced)
- Pet: Chien (polyvalent)

**BRUTE TYPE "BERSERKER" (Level 10)**
- HP: 80
- Force: 22, Agilité: 6, Rapidité: 14
- Skills: Fierce Brute, Tornado, Tragic Potion
- Arme: Hache (très high damage)
- Pet: Aucun

### Matchmaking Équilibré
```javascript
// Algorithme de matchmaking
calculatePower(brute) {
  base = level * 10
  + hp * 0.5
  + (strength + agility + speed) * 2
  + skills.length * 15
  + weapon.damage * 3
  + pet ? 50 : 0
}

// Tolérance: ±15% de puissance totale
```

### PHASE 3 : Tests et Validation (Jours 6-9)

1. **Tests déterministes** :
   - Implémenter les seeds de V10
   - Valider que les résultats correspondent au jeu original
   - Vérifier la synchronisation client/serveur
   
2. **Tests d'équilibrage** :
   - 100 combats Tank vs Rapide
   - 100 combats Équilibré vs Berserker
   - Vérifier winrate ~45-55% pour chaque archétype

2. **Validation visuelle** :
   - S'assurer que tous les éléments visuels fonctionnent
   - Vérifier les animations d'armes
   - Tester les déplacements et positionnements

3. **Correction des bugs** :
   - Résoudre les désynchronisations HP
   - Ajuster le timing des animations
   - Optimiser les performances

### PHASE 4 : Backend MMO (Semaines 2-3)

1. **Architecture Serveur** :
   ```
   Node.js + Express + PostgreSQL
   - API REST pour les combats
   - WebSocket pour temps réel
   - Système de matchmaking
   ```

2. **Fonctionnalités MMO** :
   - Tournois quotidiens/hebdomadaires
   - Système de clans
   - Classements ELO
   - Système maître/élève

3. **Persistence** :
   - Profils de brutes
   - Historique des combats
   - Statistiques détaillées

## 🛠️ COMMANDES DE DÉVELOPPEMENT

```bash
# Pour tester le rendu (NE PAS CASSER)
npm run dev

# Pour les tests de combat
npm test

# Build de production
npm run build
```

## 📂 STRUCTURE DES FICHIERS CRITIQUES

```
LaBrute RebornV08/
├── client/
│   ├── src/
│   │   ├── game/
│   │   │   ├── scenes/
│   │   │   │   └── FightSceneSpine.js  # ⚠️ PRÉSERVER LE RENDU
│   │   │   ├── managers/
│   │   │   │   └── [Nouveaux managers du moteur V10]
│   │   │   └── config/
│   │       └── assets/
│   │           ├── spine/  # ⚠️ NE PAS TOUCHER
│   │           ├── images/ # ⚠️ NE PAS TOUCHER
│   │           └── sounds/
└── server/
    └── [Backend à construire]
```

## ✅ CHECKLIST DE VALIDATION

- [ ] Les personnages gardent leur taille actuelle
- [ ] Les animations Spine fonctionnent
- [ ] Les décors s'affichent correctement
- [ ] Les déplacements sont fluides
- [ ] Les attaques d'armes sont visibles
- [ ] Les barres de vie se synchronisent
- [ ] Le moteur de combat est 100% fidèle
- [ ] Les tests déterministes passent
- [ ] Pas de désynchronisation client/serveur

## 🚨 RÈGLES D'OR

1. **JAMAIS** modifier le code de rendu sans validation
2. **TOUJOURS** tester visuellement après chaque changement
3. **PRÉSERVER** tous les assets visuels existants
4. **DOCUMENTER** chaque modification importante
5. **VALIDER** avec les tests déterministes

## 📊 MÉTRIQUES DE SUCCÈS

- Fidélité gameplay : 100% identique à LaBrute original
- Qualité visuelle : Maintien du rendu Phaser/Spine actuel
- Performance : 60 FPS stable
- Synchronisation : 0 désynchronisation HP
- Scalabilité : Support 1000+ joueurs simultanés

---

*Document de référence - À consulter avant CHAQUE modification*
*Dernière mise à jour : 24/08/2025*