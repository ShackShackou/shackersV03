# 🎯 PROFILS DE BRUTES POUR TESTS

## Configuration Immédiate pour Tests

### FIGHTER 1: "Le Tank" (Brutus)
```javascript
{
  name: "Brutus",
  level: 10,
  hp: 150,
  maxHp: 150,
  strength: 18,
  agility: 8,
  speed: 10,
  skills: [
    "armor",      // -50% dégâts reçus
    "survival",   // Survit à 1 HP une fois
    "resistant"   // Immunité aux effets négatifs
  ],
  weapons: ["hammer"],  // 10 damage, tempo 4 (lent mais puissant)
  pet: "bear"          // 30 HP, 5 damage
}
```

### FIGHTER 2: "L'Assassin" (Shadow)
```javascript
{
  name: "Shadow",
  level: 10,
  hp: 90,
  maxHp: 90,
  strength: 8,
  agility: 18,
  speed: 15,
  skills: [
    "haste",      // +50% vitesse d'attaque
    "counter",    // 30% chance de contre-attaque
    "dodge"       // 30% esquive
  ],
  weapons: ["knife"],   // 4 damage, tempo 1 (très rapide)
  pet: "panther"       // 15 HP, 3 damage, rapide
}
```

### FIGHTER 3: "Le Polyvalent" (Rex)
```javascript
{
  name: "Rex",
  level: 10,
  hp: 110,
  maxHp: 110,
  strength: 12,
  agility: 12,
  speed: 12,
  skills: [
    "block",         // 25% chance de bloquer
    "regeneration",  // +2 HP par tour
    "accuracy"       // +30% précision
  ],
  weapons: ["sword"],  // 6 damage, tempo 2 (équilibré)
  pet: "dog"          // 20 HP, 4 damage
}
```

### FIGHTER 4: "Le Berserker" (Rage)
```javascript
{
  name: "Rage",
  level: 10,
  hp: 80,
  maxHp: 80,
  strength: 22,
  agility: 6,
  speed: 14,
  skills: [
    "fierceBrute",    // +100% dégâts
    "tornado",        // Attaque zone
    "tragicPotion"    // Boost temporaire mais coût HP
  ],
  weapons: ["axe"],    // 8 damage, tempo 3
  pet: null           // Pas de pet (plus de points dans stats)
}
```

## Formules de Calcul Officielles

### Dégâts
```javascript
damage = weaponDamage * (1 + strength/10) * critMultiplier
// Exemple Tank: 10 * (1 + 18/10) * 1 = 28 damage par coup
// Exemple Assassin: 4 * (1 + 8/10) * 1 = 7.2 damage (mais frappe 4x plus vite)
```

### Initiative (qui attaque en premier)
```javascript
initiative = speed + random(0, agility)
// Plus speed = plus de chances de commencer
```

### Précision
```javascript
hitChance = 50 + agility*2 - enemyAgility
// Min 10%, Max 90%
```

## Matchmaking Random Équilibré

Pour des matchs équilibrés, le système doit :

1. **Calculer la puissance totale**
```javascript
power = level*10 + hp*0.5 + (str+agi+spd)*2 + skills.length*15 + weaponDmg*3 + (pet ? 50 : 0)

// Tank: 100 + 75 + 72 + 45 + 30 + 50 = 372
// Assassin: 100 + 45 + 82 + 45 + 12 + 50 = 334
// Polyvalent: 100 + 55 + 72 + 45 + 18 + 50 = 340
// Berserker: 100 + 40 + 84 + 45 + 24 + 0 = 293
```

2. **Matcher avec tolérance ±15%**
- Tank (372) peut affronter 316-428 power
- Assassin (334) peut affronter 284-384 power
- Polyvalent (340) peut affronter 289-391 power
- Berserker (293) peut affronter 249-337 power

## Notes pour l'Implémentation

- **IMPORTANT**: Utiliser les stats exactes ci-dessus pour les premiers tests
- Les skills doivent utiliser les formules officielles de LaBrute
- Le RNG doit être déterministe (avec seed) pour reproduire les combats
- Chaque archétype doit avoir ~50% de victoires contre les autres

## Commande de Test Rapide
```javascript
// Dans la console du jeu
testFight({
  fighter1: profiles.tank,
  fighter2: profiles.assassin,
  seed: 12345  // Pour résultat reproductible
});
```