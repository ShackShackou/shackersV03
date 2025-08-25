# 📝 NOTE - SYSTÈME PAPER DOLL (POUR PLUS TARD)

## 🎭 Situation Actuelle
- **Personnages ENTIERS** avec animations Spine complètes
- Système fonctionnel qui marche bien
- Pas de découpage en parties séparées

## 🔮 Évolution Future : Paper Doll System

### Qu'est-ce que le Paper Doll ?
Système où chaque personnage est découpé en parties :
- Tête (différentes coiffures, couleurs)
- Torse (différents vêtements, armures)
- Bras gauche/droit (peuvent tenir des armes)
- Jambes (différents pantalons, bottes)
- Accessoires (casques, boucliers, etc.)

### Avantages du Paper Doll
1. **Personnalisation infinie** : Millions de combinaisons possibles
2. **Économie de mémoire** : Réutilisation des parties
3. **Armes visibles** : L'arme équipée apparaît dans la main
4. **Armures visibles** : Les équipements changent l'apparence
5. **Blessures localisées** : Peut montrer des dégâts sur parties spécifiques

### Implémentation Future
```javascript
// Structure paper doll LaBrute original
Fighter = {
  head: { sprite: "head_01", color: "#FFD4A3" },
  torso: { sprite: "torso_muscular", armor: "leather_vest" },
  leftArm: { sprite: "arm_left", weapon: null },
  rightArm: { sprite: "arm_right", weapon: "sword_02" },
  legs: { sprite: "legs_normal", pants: "shorts_blue" }
}
```

### Priorités Actuelles
1. ✅ Faire fonctionner le jeu avec personnages entiers
2. ✅ Intégrer toute la logique de combat
3. ✅ Système d'armes et pets fonctionnel
4. ⏳ Plus tard : Migration vers paper doll

### Notes Techniques
- Le code du paper doll existe dans LaBrute original
- Fichiers concernés : `CharacterRenderer.ts`, `BodyParts.ts`
- Nécessitera refonte des animations Spine
- Possibilité de mode hybride (certains persos entiers, d'autres paper doll)

---

**IMPORTANT** : Ne PAS implémenter maintenant. Focus sur gameplay fonctionnel d'abord !