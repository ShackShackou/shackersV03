# Plan d'Implémentation Technique

## 🎯 Phase 1: Hub Principal et Entraînement (Priorité Haute)

### 1. Nouvelle Scène: HubScene

```javascript
// src/scenes/HubScene.js
export class HubScene extends Phaser.Scene {
  constructor() {
    super({ key: 'HubScene' });
  }
  
  create() {
    // Vue isométrique du camp
    // Zones cliquables pour chaque bâtiment
    // Interface de navigation
  }
}
```

### 2. Modèles de Base de Données

```prisma
// Ajouter au schema.prisma

model Building {
  id         String   @id @default(uuid())
  userId     String
  type       BuildingType
  level      Int      @default(1)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  user       User     @relation(fields: [userId], references: [id])
}

model Training {
  id         String   @id @default(uuid())
  shackerId  String
  type       TrainingType
  startTime  DateTime
  endTime    DateTime
  completed  Boolean  @default(false)
  shacker    Shacker  @relation(fields: [shackerId], references: [id])
}

model Tournament {
  id         String   @id @default(uuid())
  name       String
  type       TournamentType
  startDate  DateTime
  endDate    DateTime
  maxPlayers Int
  entryFee   Int      @default(0)
  prizes     Json
  entries    TournamentEntry[]
}

model TournamentEntry {
  id           String     @id @default(uuid())
  tournamentId String
  shackerId    String
  position     Int?
  eliminated   Boolean    @default(false)
  tournament   Tournament @relation(fields: [tournamentId], references: [id])
  shacker      Shacker    @relation(fields: [shackerId], references: [id])
}

enum BuildingType {
  BARRACKS
  TRAINING_CENTER
  FORGE
  INFIRMARY
  MARKET
}

enum TrainingType {
  STRENGTH
  AGILITY
  SPEED
  ENDURANCE
}

enum TournamentType {
  DAILY
  WEEKLY
  MONTHLY
  SPECIAL
}
```

### 3. Routes API Backend

```typescript
// server/src/routes/buildings.ts
router.get('/buildings', auth, async (req, res) => {
  // Récupérer les bâtiments du joueur
});

router.post('/buildings/upgrade', auth, async (req, res) => {
  // Améliorer un bâtiment
});

// server/src/routes/training.ts
router.post('/training/start', auth, async (req, res) => {
  // Démarrer une session d'entraînement
});

router.post('/training/complete', auth, async (req, res) => {
  // Terminer et appliquer les gains
});

// server/src/routes/tournaments.ts
router.get('/tournaments/active', async (req, res) => {
  // Liste des tournois actifs
});

router.post('/tournaments/join', auth, async (req, res) => {
  // Inscription à un tournoi
});
```

### 4. Assets Graphiques Nécessaires

- Sprites isométriques pour les bâtiments
- Animations d'entraînement
- UI pour le hub (boutons, panneaux)
- Icônes pour les ressources
- Effets visuels (particules, etc.)

## 🏗️ Phase 2: Construction et Ressources

### 1. Système de Ressources

```javascript
// src/systems/ResourceManager.js
export class ResourceManager {
  constructor(scene) {
    this.scene = scene;
    this.resources = {
      gold: 0,
      wood: 0,
      stone: 0,
      metal: 0,
      glory: 0
    };
  }
  
  async loadPlayerResources() {
    // Charger depuis l'API
  }
  
  canAfford(cost) {
    // Vérifier si le joueur peut payer
  }
  
  spend(cost) {
    // Dépenser les ressources
  }
}
```

### 2. Interface de Construction

```javascript
// src/ui/BuildingUI.js
export class BuildingUI {
  constructor(scene) {
    this.scene = scene;
  }
  
  showBuildingMenu(buildingType) {
    // Afficher les options d'amélioration
    // Coûts et bénéfices
    // Boutons d'action
  }
}
```

## 🏆 Phase 3: Tournois et Compétition

### 1. Gestionnaire de Tournois

```javascript
// src/systems/TournamentManager.js
export class TournamentManager {
  constructor() {
    this.activeTournaments = [];
  }
  
  async fetchActiveTournaments() {
    // Récupérer la liste des tournois
  }
  
  async registerForTournament(tournamentId, shackerId) {
    // Inscrire un Shacker
  }
  
  simulateBracket(participants) {
    // Simuler les combats du tournoi
  }
}
```

### 2. Scène de Tournoi

```javascript
// src/scenes/TournamentScene.js
export class TournamentScene extends Phaser.Scene {
  create() {
    // Affichage du bracket
    // Animation des combats
    // Résultats et récompenses
  }
}
```

## 📱 Optimisations Mobile

### 1. UI Responsive
- Adaptation automatique de l'interface
- Contrôles tactiles optimisés
- Gestion de l'orientation

### 2. Performance
- Lazy loading des assets
- Compression des textures
- Pool d'objets pour les animations

## 🔧 Outils de Développement

### 1. Mode Debug
```javascript
// src/debug/DebugPanel.js
export class DebugPanel {
  constructor(scene) {
    // Panel avec stats en temps réel
    // Commandes de triche pour tests
    // Logs détaillés
  }
}
```

### 2. Tests Automatisés
- Tests unitaires pour la logique de jeu
- Tests d'intégration pour l'API
- Tests de performance

## 📊 Analytics et Métriques

### 1. Tracking des Events
- Actions des joueurs
- Temps de jeu
- Taux de conversion
- Performances des features

### 2. Dashboard Admin
- Statistiques en temps réel
- Gestion des événements
- Modération des joueurs

## 🚀 Déploiement Progressif

### Semaine 1-2
- HubScene basique
- Système d'entraînement simple
- Migration DB

### Semaine 3-4
- Bâtiments niveau 1
- API complète
- Tests

### Semaine 5-6
- Tournois quotidiens
- Optimisations
- Beta test

### Semaine 7-8
- Polish et bug fixes
- Lancement public
- Monitoring
