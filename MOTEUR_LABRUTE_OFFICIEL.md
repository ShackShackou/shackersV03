# 🎮 MOTEUR DE COMBAT LABRUTE OFFICIEL - DOCUMENTATION COMPLÈTE

## 📊 FORMULES DE BASE

### HP (Points de Vie)
```javascript
HP = 50 + (max(endurance, 0) + level * 0.25) * 6
```
- HP de base : 50
- Chaque point d'endurance : +6 HP
- Chaque niveau : +1.5 HP (0.25 * 6)

### DÉGÂTS DE BASE
```javascript
BARE_HANDS_DAMAGE = 5
```

## ⚔️ FORMULES DE DÉGÂTS EXACTES

### Dégâts normaux (corps à corps)
```javascript
damage = Math.floor(
  (base + fighter.strength * (0.2 + base * 0.05))
  * (0.8 + Math.random() * 0.4) 
  * skillsMultiplier
)
```
- `base` = weapon.damage OU 5 (mains nues)
- Variation aléatoire : 80% à 120% (±20%)
- Force ajoute : 20% + 5% par point de dégât de base

### Dégâts de lancer (throw)
```javascript
damage = Math.floor(
  (base + fighter.strength * 0.1 + fighter.agility * 0.15)
  * (1 + Math.random() * 0.5) 
  * skillsMultiplier
)
```
- Variation : 100% à 150%
- Force contribue 10%, Agilité 15%

### Dégâts Piledriver (marteau)
```javascript
damage = Math.floor(
  (10 + opponent.strength * 0.6)
  * (0.8 + Math.random() * 0.4) 
  * skillsMultiplier * 4
)
```
- Utilise la force de l'ADVERSAIRE
- Multiplicateur x4

### Réduction par l'armure
```javascript
finalDamage = Math.ceil(damage * (1 - opponent.armor))
```
- L'armure réduit les dégâts en pourcentage
- Minimum 1 dégât si l'attaque touche

## 🎯 STATS DE COMBAT DE BASE

```javascript
BASE_FIGHTER_STATS = {
  reversal: 0,        // Chance de reversal
  evasion: 0.1,       // 10% esquive de base
  dexterity: 0.2,     // 20% dextérité
  block: -0.25,       // -25% blocage (négatif!)
  accuracy: 0,        // 0% précision bonus
  disarm: 0.05,       // 5% désarmement
  combo: 0,           // 0 combo de base
  deflect: 0,         // 0% déflection
  tempo: 1.2,         // Tempo de base
  criticalChance: 0.05,    // 5% critique
  criticalDamage: 1.5,     // x1.5 dégâts critiques
}
```

## 🗡️ TOUTES LES ARMES OFFICIELLES (26 armes)

### Armes Rapides (FAST)
| Arme | Damage | Tempo | Combo | Critique | Spécial |
|------|--------|-------|-------|----------|---------|
| fan | 4 | 0.28 | +0.45 | 0% | Evasion +60%, Reversal +50% |
| knife | 7 | 0.6 | +0.3 | 25% | Dextérité +50% |
| mug | 8 | 0.9 | +0.4 | 0% | Evasion +15% |
| sai | 8 | 0.6 | +0.3 | 0% | Désarme +75%, Block +30% |
| keyboard | 7 | 1.0 | +0.5 | 0% | Déflection +30% |
| racquet | 6 | 0.8 | 0 | 0% | Reversal +100%, Déflection +50% |

### Armes Lourdes (HEAVY)
| Arme | Damage | Tempo | Combo | Critique | Spécial |
|------|--------|-------|-------|----------|---------|
| axe | 55 | 2.3 | -0.4 | 0% | Accuracy +50% |
| bumps | 30 | 2.0 | -0.6 | 20% | Accuracy +30% |
| flail | 36 | 2.2 | +0.3 | -20% | Accuracy +150% (ignore esquive!) |
| fryingPan | 17 | 1.2 | -0.4 | 0% | Block +40%, Déflection +40% |
| hatchet | 17 | 1.5 | 0 | 15% | - |
| mammothBone | 14 | 1.6 | -0.1 | 15% | Accuracy +50% |
| morningStar | 20 | 1.5 | 0 | 5% | Accuracy +30% |

### Armes Longues (LONG)
| Arme | Damage | Tempo | Combo | Reach | Spécial |
|------|--------|-------|-------|--------|---------|
| baton | 6 | 1.0 | +0.1 | 3 | Reversal +30%, Block +25% |
| lance | 12 | 1.2 | 0 | 3 | Critique 15% |
| trident | 14 | 1.0 | 0 | 3 | - |
| halbard | 24 | 1.8 | +0.1 | 4 | - |
| whip | 5 | 0.2 | 0 | 4 | Accuracy +50% |

### Armes Tranchantes (SHARP)
| Arme | Damage | Tempo | Combo | Critique | Spécial |
|------|--------|-------|-------|----------|---------|
| broadsword | 10 | 1.2 | 0 | 30% | Block +15% |
| scimitar | 10 | 0.8 | +0.15 | 5% | Dextérité +20% |
| sword | 28 | 1.8 | 0 | 5% | - |

### Armes de Lancer (THROWN)
| Arme | Damage | Tempo | Combo | Spécial |
|------|--------|-------|-------|---------|
| noodleBowl | 10 | 0.45 | +0.3 | - |
| piopio | 5 | 0.32 | 0 | Désarme +50%, Evasion +50% |
| shuriken | 3 | 0.12 | +0.3 | Le plus rapide! |

### Armes Spéciales
| Arme | Damage | Tempo | Spécial |
|------|--------|-------|---------|
| leek | 5 | 1.1 | Reversal +100%, Combo +200%, Accuracy +200% |
| trombone | 9 | 0.65 | Block +20% |

## 🐾 PETS

### Dog (Chien)
- HP : 26 + niveau * 2
- Damage : 5 + niveau * 2 
- Initiative : 0.6 + niveau * 0.01
- Fréquence d'attaque : 2-3x dans le combat
- Rôle : DPS rapide

### Bear (Ours) 
- HP : 110 + niveau * 4
- Damage : 11 + niveau * 2
- Initiative : 0.9
- IMPORTANT : Réduit les HP du maître de 50%
- Tank qui prend les coups
- Ne peut mourir qu'après son maître

### Panther (Panthère)
- HP : 26 + niveau * 2
- Damage : 5 + niveau * 2
- Initiative : 0.75 + niveau * 0.01
- +15% critique sur ses attaques
- Attaque en dernier

## 🎲 PROBABILITÉS ET RNG

### Ordre d'attaque
```javascript
// Plus l'initiative est BASSE, plus on attaque TÔT
initialInitiative = tempo + agility * 0.01 + Math.random() * 0.2
// Tempo moyen : 1.2
// Avec agilité 30 : initiative ~1.5-1.7
```

### Initiative de combat
```javascript
// Calcul initial
initiative = tempo - (agility * 0.01) + Math.random() * 0.2

// Après chaque action
initiative += actionTime * tempo
// actionTime = 1 pour attaque normale
// actionTime = 0.5 pour combo  
// actionTime = 2 pour super
```
- Plus l'initiative est BASSE, plus on joue TÔT
- Les armes rapides (fan: 0.28) attaquent très souvent
- Les armes lourdes (axe: 2.3) attaquent rarement

### Chance de Critique  
```javascript
criticalChance = baseCritical + weapon.criticalChance + skillBonus
// Base : 5%
// Knife : +25% (total 30%)
// Broadsword : +30% (total 35%)
// Avec skill martial arts : +10% supplémentaire

criticalDamage = damage * 1.5
```

### Variations de Dégâts
```javascript
// Corps à corps
randomFactor = 0.8 + Math.random() * 0.4  // 80% - 120%

// Lancer d'arme
randomFactor = 1 + Math.random() * 0.5     // 100% - 150%

// Piledriver (hammer)  
randomFactor = 0.8 + Math.random() * 0.4   // 80% - 120%

// Minimum toujours 1 dégât après armure
finalDamage = Math.max(1, damage)
```

## 📈 STATS PAR NIVEAU

### Points de départ
```javascript
BRUTE_STARTING_POINTS = 11
// Répartis aléatoirement entre:
// - Force (strength)
// - Agilité (agility) 
// - Vitesse (speed)
// - Endurance
```

### Progression par niveau
```javascript
// Niveau 1 → 2 : +2 points
// Niveau 2 → 3 : +2 points
// Niveau 3+ : +1 point par niveau

// XP requis pour niveau suivant
xpForNextLevel = level * 5
```

### Déblocage des compétences
- Niveau 1-3 : Skills de base (herculeanStrength, felineAgility...)
- Niveau 4+ : Skills avancés (fierceBrute, hammer...)
- Niveau 10+ : Skills rares (immortality, untouchable...)

## 🎮 MÉCANIQUES SPÉCIALES

### Calcul de l'esquive (Evasion)
```javascript
evasionChance = 0.1 + agility * 0.002 + weaponEvasion + skillEvasion
// Base 10%
// +0.2% par point d'agilité
// Fan : +60% evasion
// Skill untouchable : +30% evasion
```

### Calcul du blocage (Block)  
```javascript
blockChance = -0.25 + weaponBlock + skillBlock
// Base NÉGATIVE -25%
// Shield skill : +45% block (total 20%)
// Frying pan : +40% block
```

### Calcul de la précision (Accuracy)
```javascript
// Si accuracy >= 1.5 : ignore l'esquive adverse
if (attacker.accuracy >= 1.5) {
  opponent.evasion = 0;
}
// Flail : +150% accuracy (ignore esquive!)
```

### Combos
```javascript
comboChance = weapon.combo + skillCombo
// Keyboard : +50% combo
// Leek : +200% combo (!)
// Skill fistsOfFury : +20% combo

// Si combo réussit
if (Math.random() < comboChance) {
  // Nouvelle attaque immédiate
  // Initiative réduite de 50%
  fighter.initiative += 0.5 * tempo;
}
```

### Reversal (Retournement)
```javascript
reversalChance = weapon.reversal + skillReversal
// Racquet : +100% reversal
// Leek : +100% reversal  
// Fan : +50% reversal

// Si reversal réussit
if (Math.random() < reversalChance) {
  // L'attaquant se prend ses propres dégâts
  // Le défenseur ne prend rien
}
```

### Désarmement
```javascript
disarmChance = 0.05 + weapon.disarm + skillDisarm
// Base : 5%
// Sai : +75% disarm (total 80%!)
// Piopio : +50% disarm
// Skill sabotage : +50% au début du combat

// Si désarmement réussit
if (Math.random() < disarmChance) {
  opponent.activeWeapon = null;
  // L'arme tombe au sol
}
```

### Tempo (Vitesse d'attaque)
```javascript
// Tempo = temps entre 2 attaques
// Plus c'est BAS, plus on attaque SOUVENT

Tempo ultra rapide:
- Shuriken : 0.12 (8 attaques/tour)
- Fan : 0.28 (3-4 attaques/tour)
- Piopio : 0.32

Tempo rapide:
- Knife : 0.6
- Sai : 0.6  
- Scimitar : 0.8

Tempo normal:
- Baton : 1.0
- Keyboard : 1.0
- Broadsword : 1.2

Tempo lent:
- Hatchet : 1.5
- Sword : 1.8
- Bumps : 2.0

Tempo très lent:
- Flail : 2.2
- Axe : 2.3
- Trombone : 2.5 (le plus lent!)
```

## 🛡️ DÉFENSE

### Déflection (Deflect)
```javascript
deflectChance = weapon.deflect + skillDeflect
// Racquet : +50% deflect
// Frying pan : +40% deflect
// Keyboard : +30% deflect

// Si déflection réussit
if (Math.random() < deflectChance) {
  // Renvoie le projectile
  // L'attaquant prend 50% des dégâts
}
```

### Esquive (Evasion)
```javascript
evasion = 0.1 + agility * 0.002 + weaponEvasion
// Base : 10%
// Fan : +60% evasion
// Piopio : +50% evasion
// Whip : +30% evasion
```

### Blocage (Block)
```javascript
block = -0.25 + weaponBlock + shieldBonus
// Base : -25% (négatif!)
// Shield : +45% (skill)
// Frying pan : +40%
// Sai : +30%
// Baton : +25%
```

### Armure
```javascript
armor = skillArmor
// Skill armor : 25% réduction
// Skill toughenedSkin : 10% réduction

// Application
finalDamage = Math.ceil(damage * (1 - armor))
// Ne s'applique PAS aux lancers d'armes
```

## 🎯 CONSTANTES IMPORTANTES

```javascript
// Combats
FIGHTS_PER_DAY = 6              // Combats max par jour
NO_WEAPON_TOSS = 10             // 10% chance lancer sans arme
BARE_HANDS_DAMAGE = 5           // Dégâts mains nues

// Arène
ARENA_OPPONENTS_COUNT = 6       // Adversaires dans l'arène
ARENA_OPPONENTS_MAX_GAP = 2     // Écart max de niveau

// Dimensions des combattants
FIGHTER_HEIGHT = {
  brute: 80,
  bear: 100,
  panther: 60,
  dog: 40
}

FIGHTER_WIDTH = {
  brute: 50,
  bear: 100,
  panther: 87,
  dog: 58
}
```

## ⚡ COMPÉTENCES (Skills) - LISTE COMPLÈTE

### Skills Passifs (modifient les stats)
| Skill | Odds | Effet |
|-------|------|-------|
| weaponsMaster | 10 | +50% dégâts avec armes |
| martialArts | 10 | +50% dégâts mains nues |
| sixthSense | 20 | +30% esquive |
| hostility | 4 | +50% contre-attaque |
| fistsOfFury | 10 | +20% combo |
| shield | 10 | +45% blocage (bouclier) |
| armor | 4 | 25% réduction dégâts |
| toughenedSkin | 30 | 10% réduction dégâts |
| untouchable | 1 | +30% esquive (RARE!) |
| sabotage | 3 | Désarme au début |
| shock | 4 | Initiative bonus |
| bodybuilder | 5 | +50% force |
| relentless | 4 | +50% vitesse |
| survival | 4 | +50% HP si < 25% |
| leadSkeleton | 4 | -50% dégâts reçus |
| balletShoes | 4 | +50% agilité |
| determination | 4 | +50% endurance |
| firstStrike | 8 | Attaque en premier |
| resistant | 3 | Immunité poison |
| counterAttack | 10 | +30% contre-attaque |
| ironHead | 4 | +50% HP |

### Skills Boosters (augmentent les stats)
| Skill | Odds | Effet |
|-------|------|-------|
| herculeanStrength | 60 | +3 force |
| felineAgility | 60 | +3 agilité |
| lightningBolt | 60 | +3 vitesse |
| vitality | 60 | +3 endurance |
| immortality | 0.14 | +10 endurance (ULTRA RARE!) |
| reconnaissance | 1 | Révèle stats adverses |

### Skills Supers (capacités actives)
| Skill | Odds | Uses | Effet |
|-------|------|------|-------|
| thief | 2.5 | 2 | Vole l'arme adverse |
| fierceBrute | 20 | 1 | x2 dégâts prochain coup |
| tragicPotion | 8 | 1 | Poison 50% HP |
| net | 10 | 1 | Immobilise 2 tours |
| bomb | 6 | 1 | 50 dégâts zone |
| hammer | 2 | 1 | Piledriver (x4 dégâts) |
| cryOfTheDamned | 2 | 1 | Fait fuir les pets |
| hypnosis | 0.5 | 1 | Retourne l'adversaire |
| flashFlood | 2.5 | 1 | Repousse tous |

### Skills Talents (capacités spéciales)
| Skill | Odds | Effet |
|-------|------|-------|
| tamer | 4 | Dompte un pet adverse |
| regeneration | 4 | +10% HP/tour |
| chef | 1 | Mange l'adversaire KO |
| spy | 2 | Copie une compétence |
| saboteur | 3 | Détruit armes au sol |
| backup | 0.5 | Appelle renforts |
| hideaway | 1 | Se cache 1 tour |
| monk | 4 | Méditation (+stats) |
| vampirism | 1 | Vole HP en attaquant |
| chaining | 1 | Enchaîne les combos |
| haste | 2 | +100% vitesse |
| treat | 4 | Soigne 25% HP |
| repulse | 2 | Repousse l'attaquant |
| fastMetabolism | 5 | +2x vitesse régen |

---

**CE DOCUMENT CONTIENT LES FORMULES EXACTES DU JEU LABRUTE OFFICIEL**
Toutes les valeurs et formules sont tirées directement du code source.