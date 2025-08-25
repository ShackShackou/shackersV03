# CONTEXTE PROJET LABRUTE - INSTRUCTIONS POUR CLAUDE

## OBJECTIF PRINCIPAL
Créer un clone 100% FIDÈLE de LaBrute avec capacités MMO, en utilisant le moteur de combat OFFICIEL et AUTHENTIQUE de LaBrute.

## DIRECTIVES CRITIQUES À TOUJOURS RESPECTER

### 1. NE JAMAIS CASSER LE MOTEUR DE RENDU
- Le moteur Phaser + Spine FONCTIONNE et doit être PRÉSERVÉ
- Fichier principal : `src/scenes/FightSceneSpine.js`
- NE PAS créer de nouvelles barres de vie (les barres en haut existent déjà)
- NE PAS ajouter de fonctionnalités visuelles non demandées

### 2. UTILISER LES VRAIES FORMULES LABRUTE
- Les formules OFFICIELLES sont dans : `external/labrute-main-20250820-001440/labrute-main/server/src/utils/fight/`
- Formule de dégâts : `damage = (base + strength * (0.2 + base * 0.05)) * (0.8 + Math.random() * 0.4) * skillsMultiplier`
- NE JAMAIS diviser les dégâts d'arme par 10
- TOUJOURS vérifier avec le code officiel avant d'implémenter

### 3. PROBLÈMES RÉCURRENTS À ÉVITER
- **Trop de miss** : L'accuracy doit être autour de 80-90%, pas 50%
- **Déséquilibre des dégâts** : Un combattant ne doit pas faire 10x plus de dégâts que l'autre
- **Personnages qui se dépassent** : Les combattants doivent rester de leur côté lors des attaques
- **Combat trop lent** : Réduire les délais entre les actions

### 4. ARCHITECTURE DU PROJET

#### Serveur (Node.js/Express)
- **Combat engine** : `server/combat/LaBruteEngine.js` (moteur principal)
- **Routes** : `server/src/routes/fights-test.ts` (endpoints de test)
- **Formules officielles** : `server/engine/labrute-official/`

#### Client (Phaser/Spine)
- **Rendu principal** : `src/scenes/FightSceneSpine.js`
- **Moteur client** : `src/engine/LaBruteClientEngine.js`
- **Formules** : `src/engine/formulas.js` (DOIT matcher le serveur)

#### Assets
- **Spine** : Utiliser uniquement spineboy pour l'instant (pas raptor)
- **Armes** : Système de placeholders pour l'instant, implémentation progressive

## APPROCHE D'IMPLÉMENTATION

### Phase 1 : BASES (EN COURS)
1. ✅ Formules de combat correctes
2. ✅ Accuracy/Evasion équilibrées
3. ⚠️ Barres de vie fonctionnelles (utiliser celles existantes)
4. ⚠️ Animations fluides sans délais excessifs

### Phase 2 : ARMES (À VENIR)
- Implémenter progressivement le système d'armes
- Commencer par les formes simples
- Ajouter les animations d'attaque spécifiques

### Phase 3 : SKILLS (À VENIR)
- Implémenter les 55 skills officiels
- Respecter les formules exactes
- Tester l'équilibrage

### Phase 4 : MMO (À VENIR)
- Matchmaking
- Serveur autoritaire
- Anti-cheat

## MÉTHODE DE TRAVAIL

1. **TOUJOURS vérifier avec le code officiel** dans `external/labrute-main-20250820-001440/`
2. **TESTER chaque modification** avant de passer à la suivante
3. **NE PAS ajouter de features non demandées**
4. **PRÉSERVER le code qui fonctionne**
5. **Comparer CONSTAMMENT avec LaBrute officiel**

## PROBLÈMES ACTUELS À RÉSOUDRE

1. **Barres de vie** : Supprimer les barres vertes créées, utiliser seulement celles en haut
2. **Équilibrage** : Vérifier que les dégâts sont équilibrés entre combattants
3. **Position des combattants** : Corriger le dépassement lors des attaques
4. **Vitesse de combat** : Réduire encore les délais

## NOTES IMPORTANTES

- L'utilisateur est frustré par les problèmes récurrents
- Il veut un clone EXACT de LaBrute, pas d'innovations
- Il préfère une implémentation progressive et stable
- Il veut que les formules soient 100% fidèles à l'original

## FICHIERS CRITIQUES À NE PAS CASSER

1. `src/scenes/FightSceneSpine.js` - Moteur de rendu principal
2. `server/combat/LaBruteEngine.js` - Moteur de combat serveur
3. `public/mmo-test.html` - Page de test principale

## COMMANDES UTILES

```bash
# Client
npm run dev

# Serveur
cd server && npm run dev

# Test
Ouvrir http://localhost:5174/mmo-test.html
```

---

**RAPPEL** : En cas de doute, TOUJOURS vérifier avec le code officiel dans `external/labrute-main-20250820-001440/` et NE PAS innover.