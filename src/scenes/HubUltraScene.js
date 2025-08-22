import Phaser from 'phaser';

export class HubUltraScene extends Phaser.Scene {
  constructor() {
    super({ key: 'HubUltraScene' });
    
    // État du joueur
    this.playerData = {
      level: 1,
      xp: 0,
      gold: 1000,
      gems: 50,
      glory: 0,
      stats: {
        strength: 10,
        agility: 10,
        defense: 10,
        magic: 5
      },
      buildings: {
        training: { level: 1, unlocked: true },
        tavern: { level: 0, unlocked: true },      // Déverrouillé
        blacksmith: { level: 0, unlocked: true },  // Déverrouillé
        arena: { level: 0, unlocked: true },       // Déverrouillé
        market: { level: 0, unlocked: true },      // Déverrouillé
        home: { level: 0, unlocked: false },
        mageTower: { level: 0, unlocked: false }
      }
    };
    
    // Configuration des bâtiments avec style Swords & Souls
    this.buildingConfigs = {
      training: {
        name: 'Centre d\'Entraînement',
        icon: '⚔️',
        position: { x: 250, y: 400 },
        scale: 1.4,
        color: 0xFF6347,
        unlockLevel: 1,
        description: 'Entraînez-vous dans 5 disciplines différentes',
        activities: ['Mêlée', 'Distance', 'Défense', 'Agilité', 'Magie']
      },
      tavern: {
        name: 'Taverne',
        icon: '🍺',
        position: { x: 450, y: 380 },
        scale: 1.2,
        color: 0x8B4513,
        unlockLevel: 3,
        description: 'Recrutez des compagnons et écoutez les rumeurs',
        activities: ['Recruter', 'Quêtes', 'Rumeurs']
      },
      blacksmith: {
        name: 'Forge',
        icon: '🔨',
        position: { x: 650, y: 400 },
        scale: 1.3,
        color: 0x696969,
        unlockLevel: 5,
        description: 'Forgez et améliorez vos armes et armures',
        activities: ['Forger', 'Améliorer', 'Enchanter']
      },
      arena: {
        name: 'Arène',
        icon: '🏟️',
        position: { x: 850, y: 420 },
        scale: 1.5,
        color: 0xFFD700,
        unlockLevel: 8,
        description: 'Affrontez des adversaires pour la gloire',
        activities: ['Duel', 'Tournoi', 'Survie']
      },
      market: {
        name: 'Marché',
        icon: '💰',
        position: { x: 350, y: 500 },
        scale: 1.1,
        color: 0x32CD32,
        unlockLevel: 2,
        description: 'Achetez et vendez des objets',
        activities: ['Acheter', 'Vendre', 'Échanger']
      },
      home: {
        name: 'Maison',
        icon: '🏠',
        position: { x: 550, y: 520 },
        scale: 1.0,
        color: 0xDEB887,
        unlockLevel: 10,
        description: 'Votre chez-vous, décorez et reposez-vous',
        activities: ['Décorer', 'Repos', 'Coffre']
      },
      mageTower: {
        name: 'Tour du Mage',
        icon: '🌟',
        position: { x: 750, y: 350 },
        scale: 1.3,
        color: 0x9370DB,
        unlockLevel: 15,
        description: 'Apprenez la magie et créez des potions',
        activities: ['Sorts', 'Potions', 'Enchantements']
      }
    };
    
    this.selectedShacker = null;
    this.npcs = [];
    this.particles = {};
    this.buildingSprites = {};
  }

  preload() {
    console.log('HubUltraScene - Début du preload');
    
    // Vérifier si Spine est disponible
    if (this.spine) {
      console.log('Spine disponible, chargement des assets...');
      try {
        this.load.spine('shacker', 'assets/spine/spineboy.json', 'assets/spine/spineboy.atlas');
        this.load.spine('npc', 'assets/spine/raptor.json', 'assets/spine/raptor.atlas');
      } catch (e) {
        console.warn('Erreur lors du chargement Spine:', e);
      }
    } else {
      console.log('Spine non disponible, utilisation des sprites de base');
    }
    
    // Événement de fin de chargement
    this.load.on('complete', () => {
      console.log('HubUltraScene - Chargement terminé');
    });
  }

  create() {
    console.log('HubUltraScene - Début de create()');
    
    try {
      // Créer le background magnifique
      this.createAdvancedBackground();
      
      // Créer l'interface utilisateur
      this.createUI();
      
      // Créer les bâtiments
      this.createBuildings();
      
      // Créer les NPCs animés
      this.createNPCs();
      
      // Ajouter le personnage principal avec Spine
      this.createMainCharacter();
      
      // Effets d'ambiance
      this.createAmbientEffects();
      
      // Musique d'ambiance
      this.playAmbientMusic();
      
      // Système de quêtes
      this.initQuestSystem();
      
      // Animations d'entrée
      this.playEntryAnimations();
      
      console.log('HubUltraScene - create() terminé avec succès');
    } catch (error) {
      console.error('Erreur dans HubUltraScene.create():', error);
      // Afficher un message d'erreur à l'écran
      this.add.text(512, 384, 'Erreur de chargement: ' + error.message, {
        fontSize: '24px',
        color: '#ff0000',
        backgroundColor: '#000000',
        padding: { x: 20, y: 10 }
      }).setOrigin(0.5);
    }
  }

  createAdvancedBackground() {
    // Ciel avec dégradé dynamique
    const graphics = this.add.graphics();
    
    // Dégradé du ciel (matin/soir selon l'heure)
    const hour = new Date().getHours();
    const isEvening = hour >= 17 || hour < 6;
    
    const topColor = isEvening ? 0x1a1a2e : 0x87CEEB;
    const bottomColor = isEvening ? 0x16213e : 0xFFE4B5;
    
    for (let i = 0; i < 600; i++) {
      const color = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.IntegerToColor(topColor),
        Phaser.Display.Color.IntegerToColor(bottomColor),
        600,
        i
      );
      graphics.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b));
      graphics.fillRect(0, i, 1024, 1);
    }
    
    // Soleil ou lune
    const celestialBody = this.add.circle(
      isEvening ? 150 : 850,
      isEvening ? 100 : 120,
      isEvening ? 40 : 50,
      isEvening ? 0xF0E68C : 0xFFD700
    );
    celestialBody.setAlpha(isEvening ? 0.8 : 1);
    
    // Nuages parallaxe
    this.createParallaxClouds();
    
    // Montagnes en arrière-plan
    this.createMountains();
    
    // Sol détaillé
    this.createDetailedGround();
  }

  createParallaxClouds() {
    // Nuages statiques pour améliorer les performances
    for (let i = 0; i < 3; i++) {
      const cloud = this.add.ellipse(
        200 + i * 300,
        50 + i * 30,
        120,
        50,
        0xffffff,
        0.3
      );
    }
  }

  createMountains() {
    const mountains = this.add.graphics();
    
    // Montagnes lointaines
    mountains.fillStyle(0x4a5568, 0.3);
    mountains.beginPath();
    mountains.moveTo(0, 400);
    for (let x = 0; x <= 1024; x += 50) {
      const y = 300 + Math.sin(x * 0.01) * 50 + Math.random() * 30;
      mountains.lineTo(x, y);
    }
    mountains.lineTo(1024, 400);
    mountains.closePath();
    mountains.fillPath();
    
    // Montagnes proches
    mountains.fillStyle(0x2d3748, 0.5);
    mountains.beginPath();
    mountains.moveTo(0, 450);
    for (let x = 0; x <= 1024; x += 40) {
      const y = 350 + Math.sin(x * 0.02) * 40 + Math.random() * 20;
      mountains.lineTo(x, y);
    }
    mountains.lineTo(1024, 450);
    mountains.closePath();
    mountains.fillPath();
  }

  createDetailedGround() {
    // Sol principal
    const ground = this.add.rectangle(512, 650, 1024, 300, 0x3B7F3C);
    
    // Chemin pavé entre les bâtiments
    const path = this.add.graphics();
    path.lineStyle(80, 0x8B7355, 0.6);
    
    // Chemin principal
    const pathPoints = [
      { x: 250, y: 450 },
      { x: 450, y: 440 },
      { x: 650, y: 450 },
      { x: 850, y: 470 }
    ];
    
    // Dessiner le chemin avec des lignes droites (quadraticCurveTo n'existe pas dans Phaser)
    path.beginPath();
    path.moveTo(pathPoints[0].x, pathPoints[0].y);
    
    for (let i = 1; i < pathPoints.length; i++) {
      path.lineTo(pathPoints[i].x, pathPoints[i].y);
    }
    
    path.strokePath();
    
    // Détails du sol (herbe, pierres, fleurs)
    this.createGroundDetails();
  }

  createGroundDetails() {
    // Détails réduits pour améliorer les performances
    
    // Quelques fleurs seulement
    for (let i = 0; i < 5; i++) {
      const flower = this.add.circle(
        200 + i * 150,
        550 + i * 20,
        4,
        Phaser.Math.RND.pick([0xFF69B4, 0xFFFF00])
      );
      flower.setAlpha(0.8);
    }
    
    // Quelques pierres
    for (let i = 0; i < 3; i++) {
      const stone = this.add.ellipse(
        150 + i * 300,
        600,
        20,
        12,
        0x696969
      );
      stone.setAlpha(0.6);
    }
  }

  createBuildings() {
    Object.entries(this.buildingConfigs).forEach(([key, config]) => {
      const isUnlocked = this.playerData.buildings[key].unlocked;
      
      // Container pour le bâtiment
      const buildingContainer = this.add.container(config.position.x, config.position.y);
      
      // Ombre du bâtiment
      const shadow = this.add.ellipse(0, 60, 140 * config.scale, 40 * config.scale, 0x000000, 0.3);
      buildingContainer.add(shadow);
      
      // Créer le bâtiment avec détails
      const building = this.createDetailedBuilding(config, isUnlocked);
      buildingContainer.add(building);
      
      // Ajouter des animations d'idle
      if (isUnlocked) {
        this.addBuildingAnimations(buildingContainer, config);
      }
      
      // Stocker la référence
      this.buildingSprites[key] = buildingContainer;
      
      // Si débloqué, rendre interactif
      if (isUnlocked) {
        this.makeBuildingInteractive(buildingContainer, key, config);
      }
    });
  }

  createDetailedBuilding(config, isUnlocked) {
    const container = this.add.container();
    
    const width = 160 * config.scale;
    const height = 200 * config.scale;
    
    // Corps du bâtiment
    const buildingGraphics = this.add.graphics();
    
    if (isUnlocked) {
      // Bâtiment coloré et détaillé
      buildingGraphics.fillStyle(config.color, 1);
      buildingGraphics.fillRoundedRect(-width/2, -height/2 + 40, width, height * 0.7, 15);
      
      // Toit
      buildingGraphics.fillStyle(config.color * 0.7, 1);
      buildingGraphics.beginPath();
      buildingGraphics.moveTo(-width/2 - 10, -height/2 + 40);
      buildingGraphics.lineTo(0, -height/2 - 20);
      buildingGraphics.lineTo(width/2 + 10, -height/2 + 40);
      buildingGraphics.closePath();
      buildingGraphics.fillPath();
      
      // Cheminée pour certains bâtiments
      if (config.name.includes('Forge') || config.name.includes('Maison')) {
        buildingGraphics.fillStyle(0x4a4a4a, 1);
        buildingGraphics.fillRect(width * 0.3, -height/2, 20, 40);
        
        // Pas de fumée animée pour améliorer les performances
      }
      
      // Porte
      buildingGraphics.fillStyle(0x4a2c00, 1);
      buildingGraphics.fillRoundedRect(-30, height/2 - 100, 60, 80, 10);
      
      // Fenêtres
      buildingGraphics.fillStyle(0xffffcc, 0.8);
      buildingGraphics.fillRoundedRect(-width/3, -20, 40, 40, 5);
      buildingGraphics.fillRoundedRect(width/3 - 40, -20, 40, 40, 5);
      
      // Enseigne
      const sign = this.add.container(0, -height/2 - 50);
      const signBg = this.add.rectangle(0, 0, 100, 40, 0x8B4513);
      const signText = this.add.text(0, 0, config.icon, { fontSize: '32px' }).setOrigin(0.5);
      sign.add([signBg, signText]);
      
      // Pas d'animation pour l'enseigne
      
      container.add([buildingGraphics, sign]);
    } else {
      // Bâtiment verrouillé (silhouette sombre)
      buildingGraphics.fillStyle(0x2a2a2a, 0.8);
      buildingGraphics.fillRoundedRect(-width/2, -height/2 + 40, width, height * 0.7, 15);
      
      // Cadenas
      const lock = this.add.text(0, 0, '🔒', { fontSize: '48px' }).setOrigin(0.5);
      container.add([buildingGraphics, lock]);
    }
    
    return container;
  }

  createSmoke(x, y) {
    // Créer une texture simple pour la fumée
    if (!this.textures.exists('smoke-particle')) {
      const graphics = this.make.graphics({ x: 0, y: 0, add: false });
      graphics.fillStyle(0xffffff, 1);
      graphics.fillCircle(16, 16, 16);
      graphics.generateTexture('smoke-particle', 32, 32);
      graphics.destroy();
    }
    
    const smokeEmitter = this.add.particles(x, y, 'smoke-particle', {
      scale: { start: 0.3, end: 0.8 },
      alpha: { start: 0.6, end: 0 },
      speed: { min: 20, max: 40 },
      angle: { min: -110, max: -70 },
      lifespan: 2000,
      frequency: 500,
      tint: 0x888888
    });
    
    return smokeEmitter;
  }

  addBuildingAnimations(buildingContainer, config) {
    // Pas d'animations automatiques pour les bâtiments
    // Seulement des effets au survol
  }

  makeBuildingInteractive(buildingContainer, key, config) {
    buildingContainer.setSize(160 * config.scale, 200 * config.scale);
    buildingContainer.setInteractive();
    
    // Effet de survol
    buildingContainer.on('pointerover', () => {
      this.tweens.add({
        targets: buildingContainer,
        scale: config.scale * 1.1,
        duration: 200,
        ease: 'Power2'
      });
      
      // Afficher info-bulle
      this.showBuildingTooltip(config, buildingContainer);
    });
    
    buildingContainer.on('pointerout', () => {
      this.tweens.add({
        targets: buildingContainer,
        scale: config.scale,
        duration: 200,
        ease: 'Power2'
      });
      
      // Cacher info-bulle
      this.hideTooltip();
    });
    
    buildingContainer.on('pointerdown', () => {
      this.enterBuilding(key, config);
    });
  }

  showBuildingTooltip(config, buildingContainer) {
    if (this.tooltip) this.tooltip.destroy();
    
    this.tooltip = this.add.container(buildingContainer.x, buildingContainer.y - 150);
    
    const bg = this.add.rectangle(0, 0, 300, 120, 0x000000, 0.8);
    bg.setStrokeStyle(2, 0xffffff);
    
    const title = this.add.text(0, -40, config.name, {
      fontSize: '24px',
      color: '#FFD700',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    const desc = this.add.text(0, -10, config.description, {
      fontSize: '14px',
      color: '#ffffff',
      wordWrap: { width: 280 }
    }).setOrigin(0.5);
    
    const activities = this.add.text(0, 30, '🎮 ' + config.activities.join(' | '), {
      fontSize: '16px',
      color: '#88ff88'
    }).setOrigin(0.5);
    
    this.tooltip.add([bg, title, desc, activities]);
    
    // Animation d'apparition
    this.tooltip.setScale(0);
    this.tweens.add({
      targets: this.tooltip,
      scale: 1,
      duration: 200,
      ease: 'Back.easeOut'
    });
  }

  hideTooltip() {
    if (this.tooltip) {
      this.tweens.add({
        targets: this.tooltip,
        scale: 0,
        duration: 150,
        onComplete: () => {
          this.tooltip.destroy();
          this.tooltip = null;
        }
      });
    }
  }

  enterBuilding(key, config) {
    // Effet de transition
    const flash = this.add.rectangle(512, 384, 1024, 768, 0xffffff, 0);
    this.tweens.add({
      targets: flash,
      alpha: 1,
      duration: 200,
      yoyo: true,
      onComplete: () => {
        flash.destroy();
        
        // Lancer la scène appropriée
        switch(key) {
          case 'training':
            // Vérifier si la scène existe
            if (this.scene.manager.keys['TrainingSelectionScene']) {
              this.scene.start('TrainingSelectionScene', { 
                playerData: this.playerData,
                activities: config.activities 
              });
            } else {
              console.error('TrainingSelectionScene non trouvée');
              // Aller directement au mini-jeu de mêlée
              if (this.scene.manager.keys['MeleeTrainingScene']) {
                this.scene.start('MeleeTrainingScene', { playerData: this.playerData });
              } else {
                this.showMessage('Erreur: Scène d\'entraînement non disponible');
              }
            }
            break;
          case 'arena':
            this.showComingSoon('Arène - Mode Combat');
            break;
          case 'market':
            this.showMarketPopup();
            break;
          case 'tavern':
            this.showTavernPopup();
            break;
          case 'blacksmith':
            this.showComingSoon('Forge - Création d\'armes');
            break;
          case 'home':
            this.showComingSoon('Maison - Niveau 10 requis');
            break;
          case 'mageTower':
            this.showComingSoon('Tour du Mage - Niveau 15 requis');
            break;
          default:
            this.showComingSoon(config.name);
        }
      }
    });
  }

  createNPCs() {
    const npcConfigs = [
      { x: 150, y: 450, type: 'villager', animation: 'idle', color: 0x8B4513 },
      { x: 550, y: 480, type: 'guard', animation: 'patrol', color: 0x4169E1 },
      { x: 750, y: 460, type: 'merchant', animation: 'idle', color: 0x32CD32 },
      { x: 950, y: 470, type: 'child', animation: 'play', color: 0xFF69B4 }
    ];
    
    npcConfigs.forEach(config => {
      // Utiliser des sprites simples au lieu de Spine pour éviter les erreurs
      const npcContainer = this.add.container(config.x, config.y);
      
      // Corps du NPC
      const body = this.add.circle(0, 0, 25, config.color);
      const head = this.add.circle(0, -35, 20, 0xFFDBB6);
      
      // Label
      const label = this.add.text(0, -60, config.type, {
        fontSize: '14px',
        color: '#ffffff',
        backgroundColor: '#000000',
        padding: { x: 5, y: 2 }
      }).setOrigin(0.5);
      
      npcContainer.add([body, head, label]);
      
      // Garde statique pour éviter les bugs
      if (config.animation === 'patrol') {
        // Pas de mouvement automatique
      }
      
      // Pas d'animation automatique pour les NPCs idle
      
      this.npcs.push(npcContainer);
    });
  }

  createMainCharacter() {
    // Toujours utiliser le fallback pour éviter les erreurs Spine
    this.mainCharacter = this.add.container(512, 500);
    
    // Corps du personnage principal
    const body = this.add.circle(0, 0, 30, 0xff6347);
    const head = this.add.circle(0, -40, 20, 0xffdbac);
    
    // Épée simple
    const sword = this.add.rectangle(40, -10, 60, 8, 0xc0c0c0);
    sword.setOrigin(0, 0.5);
    
    this.mainCharacter.add([body, head, sword]);
    
    // Permettre le mouvement avec la souris
    this.input.on('pointerdown', (pointer) => {
      if (pointer.y > 400 && pointer.y < 600) {
        this.moveCharacterTo(pointer.x, pointer.y);
      }
    });
  }

  moveCharacterTo(x, y) {
    if (!this.mainCharacter) return;
    
    const distance = Phaser.Math.Distance.Between(
      this.mainCharacter.x, this.mainCharacter.y, x, y
    );
    
    const duration = distance * 10;
    
    // Flip selon la direction
    if (x < this.mainCharacter.x) {
      this.mainCharacter.scaleX = -1;
    } else {
      this.mainCharacter.scaleX = 1;
    }
    
    // Déplacement simple sans animation
    this.tweens.add({
      targets: this.mainCharacter,
      x: x,
      y: y,
      duration: duration
    });
  }

  createAmbientEffects() {
    // Réduire les effets pour améliorer les performances
    
    // Créer les textures de particules si nécessaire
    if (!this.textures.exists('dust-particle')) {
      const graphics = this.make.graphics({ x: 0, y: 0, add: false });
      graphics.fillStyle(0xffffff, 1);
      graphics.fillCircle(8, 8, 8);
      graphics.generateTexture('dust-particle', 16, 16);
      graphics.destroy();
    }
    
    // Particules désactivées pour améliorer les performances
    // Les réactiver plus tard si nécessaire
  }

  createUI() {
    // Barre du haut avec stats
    const topBar = this.add.rectangle(512, 30, 1024, 60, 0x000000, 0.7);
    
    // Stats du joueur
    const statsText = this.add.text(20, 30, '', {
      fontSize: '20px',
      color: '#ffffff'
    }).setOrigin(0, 0.5);
    
    this.updateStatsDisplay(statsText);
    
    // Boutons de navigation
    this.createNavigationButtons();
    
    // Indicateurs de quêtes
    this.createQuestIndicators();
  }

  updateStatsDisplay(statsText) {
    statsText.setText([
      `Niveau ${this.playerData.level}`,
      `💰 ${this.playerData.gold}`,
      `💎 ${this.playerData.gems}`,
      `⭐ ${this.playerData.glory}`,
      `⚔️ ${this.playerData.stats.strength}`,
      `🏃 ${this.playerData.stats.agility}`,
      `🛡️ ${this.playerData.stats.defense}`,
      `✨ ${this.playerData.stats.magic}`
    ].join('  '));
  }

  createNavigationButtons() {
    // Bouton Menu
    const menuBtn = this.add.rectangle(50, 720, 100, 40, 0x4444ff)
      .setInteractive()
      .setStrokeStyle(2, 0xffffff);
    
    this.add.text(50, 720, 'Menu', {
      fontSize: '20px',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    menuBtn.on('pointerover', () => menuBtn.setFillStyle(0x6666ff));
    menuBtn.on('pointerout', () => menuBtn.setFillStyle(0x4444ff));
    menuBtn.on('pointerdown', () => {
      this.scene.start('MainMenuScene');
    });
    
    // Bouton Carte
    const mapBtn = this.add.rectangle(974, 720, 100, 40, 0x44ff44)
      .setInteractive()
      .setStrokeStyle(2, 0xffffff);
    
    this.add.text(974, 720, 'Carte', {
      fontSize: '20px',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    mapBtn.on('pointerover', () => mapBtn.setFillStyle(0x66ff66));
    mapBtn.on('pointerout', () => mapBtn.setFillStyle(0x44ff44));
    mapBtn.on('pointerdown', () => {
      this.showMapPopup();
    });
  }

  createQuestIndicators() {
    // Indicateurs de quêtes au-dessus des bâtiments
    const quests = [
      { building: 'training', type: 'daily', icon: '❗' },
      { building: 'tavern', type: 'story', icon: '❓' },
      { building: 'arena', type: 'challenge', icon: '⚔️' }
    ];
    
    quests.forEach(quest => {
      if (this.buildingSprites[quest.building] && 
          this.playerData.buildings[quest.building].unlocked) {
        
        const indicator = this.add.text(
          this.buildingSprites[quest.building].x,
          this.buildingSprites[quest.building].y - 120,
          quest.icon,
          { fontSize: '32px' }
        ).setOrigin(0.5);
        
        // Animation de rebond
        this.tweens.add({
          targets: indicator,
          y: indicator.y - 10,
          duration: 1000,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }
    });
  }

  initQuestSystem() {
    this.quests = {
      daily: [
        { 
          id: 'train_strength',
          name: 'Entraînement de Force',
          description: 'Complétez 3 sessions d\'entraînement de mêlée',
          reward: { gold: 100, xp: 50 },
          progress: 0,
          target: 3
        },
        {
          id: 'win_duels',
          name: 'Duelliste',
          description: 'Gagnez 5 duels dans l\'arène',
          reward: { gold: 200, glory: 10 },
          progress: 0,
          target: 5
        }
      ],
      story: [
        {
          id: 'find_artifact',
          name: 'L\'Artefact Perdu',
          description: 'Trouvez l\'artefact ancien dans les ruines',
          reward: { gems: 20, xp: 200 },
          completed: false
        }
      ]
    };
  }

  playAmbientMusic() {
    // Musique d'ambiance qui change selon l'heure
    const hour = new Date().getHours();
    const isNight = hour >= 19 || hour < 6;
    
    // Si vous avez des fichiers audio
    // this.sound.play(isNight ? 'night-ambience' : 'day-ambience', { loop: true, volume: 0.3 });
  }

  playEntryAnimations() {
    // Animation simple de fondu
    const fadeIn = this.add.rectangle(512, 384, 1024, 768, 0x000000, 1);
    
    this.tweens.add({
      targets: fadeIn,
      alpha: 0,
      duration: 500,
      onComplete: () => fadeIn.destroy()
    });
  }

  // Popups pour les activités
  showMarketPopup() {
    const popup = this.createPopup('Marché', 600, 500);
    
    const items = [
      { name: 'Potion de Vie', price: 50, icon: '🧪' },
      { name: 'Épée en Fer', price: 200, icon: '⚔️' },
      { name: 'Bouclier Renforcé', price: 150, icon: '🛡️' },
      { name: 'Amulette Magique', price: 300, icon: '📿' }
    ];
    
    items.forEach((item, index) => {
      const itemBg = this.add.rectangle(0, -100 + index * 60, 550, 50, 0x333333)
        .setInteractive();
      
      const itemText = this.add.text(-250, -100 + index * 60, 
        `${item.icon} ${item.name} - ${item.price} 💰`, 
        { fontSize: '20px', color: '#ffffff' }
      ).setOrigin(0, 0.5);
      
      const buyBtn = this.add.rectangle(200, -100 + index * 60, 80, 35, 0x44ff44)
        .setInteractive();
      
      const buyText = this.add.text(200, -100 + index * 60, 'Acheter', 
        { fontSize: '16px', color: '#ffffff' }
      ).setOrigin(0.5);
      
      popup.content.add([itemBg, itemText, buyBtn, buyText]);
      
      buyBtn.on('pointerdown', () => {
        if (this.playerData.gold >= item.price) {
          this.playerData.gold -= item.price;
          this.showNotification(`${item.name} acheté!`, 0x44ff44);
          // Mettre à jour l'affichage
        } else {
          this.showNotification('Pas assez d\'or!', 0xff4444);
        }
      });
    });
  }

  showTavernPopup() {
    const popup = this.createPopup('Taverne', 700, 600);
    
    // Onglets
    const tabs = ['Recruter', 'Quêtes', 'Rumeurs'];
    let currentTab = 0;
    
    const tabButtons = tabs.map((tab, index) => {
      const btn = this.add.rectangle(-200 + index * 150, -250, 140, 40, 
        index === 0 ? 0x6666ff : 0x444444)
        .setInteractive();
      
      const text = this.add.text(-200 + index * 150, -250, tab, 
        { fontSize: '18px', color: '#ffffff' }
      ).setOrigin(0.5);
      
      popup.content.add([btn, text]);
      
      btn.on('pointerdown', () => {
        currentTab = index;
        updateTabContent();
      });
      
      return { btn, text };
    });
    
    const tabContent = this.add.container();
    popup.content.add(tabContent);
    
    const updateTabContent = () => {
      tabContent.removeAll(true);
      tabButtons.forEach((tab, i) => {
        tab.btn.setFillStyle(i === currentTab ? 0x6666ff : 0x444444);
      });
      
      switch(currentTab) {
        case 0: // Recruter
          this.showRecruitContent(tabContent);
          break;
        case 1: // Quêtes
          this.showQuestContent(tabContent);
          break;
        case 2: // Rumeurs
          this.showRumorContent(tabContent);
          break;
      }
    };
    
    updateTabContent();
  }

  showRecruitContent(container) {
    const companions = [
      { name: 'Archer Elfe', cost: 500, stats: '🏹 +10 Distance' },
      { name: 'Guerrier Nain', cost: 800, stats: '⚔️ +15 Force' },
      { name: 'Mage Mystique', cost: 1200, stats: '✨ +20 Magie' }
    ];
    
    companions.forEach((comp, index) => {
      const bg = this.add.rectangle(0, -150 + index * 80, 600, 70, 0x3a3a3a);
      const text = this.add.text(-280, -150 + index * 80, 
        `${comp.name}\n${comp.stats} - Coût: ${comp.cost} 💰`,
        { fontSize: '18px', color: '#ffffff' }
      ).setOrigin(0, 0.5);
      
      const recruitBtn = this.add.rectangle(250, -150 + index * 80, 100, 40, 0x44ff44)
        .setInteractive();
      
      const btnText = this.add.text(250, -150 + index * 80, 'Recruter',
        { fontSize: '16px', color: '#ffffff' }
      ).setOrigin(0.5);
      
      container.add([bg, text, recruitBtn, btnText]);
    });
  }

  showQuestContent(container) {
    const allQuests = [
      ...this.quests.daily.map(q => ({ ...q, type: 'Quotidienne' })),
      ...this.quests.story.map(q => ({ ...q, type: 'Histoire' }))
    ];
    
    allQuests.forEach((quest, index) => {
      const bg = this.add.rectangle(0, -150 + index * 100, 600, 90, 0x3a3a3a);
      
      const title = this.add.text(-280, -170 + index * 100, quest.name,
        { fontSize: '20px', color: '#FFD700', fontStyle: 'bold' }
      ).setOrigin(0, 0.5);
      
      const desc = this.add.text(-280, -150 + index * 100, quest.description,
        { fontSize: '16px', color: '#ffffff' }
      ).setOrigin(0, 0.5);
      
      const progress = quest.target ? 
        `Progrès: ${quest.progress}/${quest.target}` : 
        (quest.completed ? '✅ Complété' : '❌ Non complété');
      
      const progressText = this.add.text(-280, -130 + index * 100, progress,
        { fontSize: '14px', color: '#88ff88' }
      ).setOrigin(0, 0.5);
      
      container.add([bg, title, desc, progressText]);
    });
  }

  showRumorContent(container) {
    const rumors = [
      'On raconte qu\'un trésor est caché dans les montagnes...',
      'Le forgeron a reçu un minerai mystérieux hier soir.',
      'Des monstres étranges ont été aperçus près de la forêt.',
      'Le tournoi de ce mois aura des récompenses doublées!'
    ];
    
    rumors.forEach((rumor, index) => {
      const bg = this.add.rectangle(0, -150 + index * 60, 600, 50, 0x3a3a3a);
      const text = this.add.text(0, -150 + index * 60, `💬 ${rumor}`,
        { fontSize: '16px', color: '#ffffff', wordWrap: { width: 580 } }
      ).setOrigin(0.5);
      
      container.add([bg, text]);
    });
  }

  showMapPopup() {
    const popup = this.createPopup('Carte du Monde', 800, 600);
    
    // Mini carte
    const mapBg = this.add.rectangle(0, 0, 750, 500, 0x2a4a2a);
    popup.content.add(mapBg);
    
    // Zones
    const zones = [
      { name: 'Village (Vous êtes ici)', x: 0, y: 0, unlocked: true },
      { name: 'Forêt Sombre', x: -200, y: -100, unlocked: true },
      { name: 'Montagnes Enneigées', x: 200, y: -150, unlocked: false },
      { name: 'Désert Brûlant', x: -150, y: 150, unlocked: false },
      { name: 'Ruines Anciennes', x: 250, y: 100, unlocked: false }
    ];
    
    zones.forEach(zone => {
      const marker = this.add.circle(zone.x, zone.y, 20, 
        zone.unlocked ? 0x44ff44 : 0x666666);
      
      const label = this.add.text(zone.x, zone.y + 30, zone.name, {
        fontSize: '14px',
        color: zone.unlocked ? '#ffffff' : '#666666'
      }).setOrigin(0.5);
      
      popup.content.add([marker, label]);
      
      if (zone.unlocked && zone.name !== 'Village (Vous êtes ici)') {
        marker.setInteractive();
        marker.on('pointerdown', () => {
          this.showNotification(`Voyage vers ${zone.name}...`, 0x4444ff);
          popup.close();
        });
      }
    });
  }

  createPopup(title, width = 600, height = 400) {
    const popup = this.add.container(512, 384);
    
    // Fond sombre
    const overlay = this.add.rectangle(0, 0, 1024, 768, 0x000000, 0.7);
    overlay.setInteractive(); // Bloquer les clics
    
    // Fenêtre popup
    const bg = this.add.rectangle(0, 0, width, height, 0x2a2a2a);
    bg.setStrokeStyle(3, 0xffffff);
    
    // Titre
    const titleBg = this.add.rectangle(0, -height/2 + 30, width, 60, 0x444444);
    const titleText = this.add.text(0, -height/2 + 30, title, {
      fontSize: '32px',
      color: '#FFD700',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // Bouton fermer
    const closeBtn = this.add.text(width/2 - 30, -height/2 + 30, '✖', {
      fontSize: '28px',
      color: '#ffffff'
    }).setOrigin(0.5).setInteractive();
    
    // Contenu
    const content = this.add.container();
    
    popup.add([overlay, bg, titleBg, titleText, closeBtn, content]);
    popup.content = content;
    
    // Fonction de fermeture
    popup.close = () => {
      this.tweens.add({
        targets: popup,
        scale: 0,
        alpha: 0,
        duration: 200,
        onComplete: () => popup.destroy()
      });
    };
    
    closeBtn.on('pointerdown', popup.close);
    
    // Animation d'ouverture
    popup.setScale(0);
    this.tweens.add({
      targets: popup,
      scale: 1,
      duration: 300,
      ease: 'Back.easeOut'
    });
    
    return popup;
  }

  showNotification(message, color = 0x4444ff) {
    const notif = this.add.container(512, 100);
    
    const bg = this.add.rectangle(0, 0, 400, 60, color, 0.9);
    bg.setStrokeStyle(2, 0xffffff);
    
    const text = this.add.text(0, 0, message, {
      fontSize: '24px',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    notif.add([bg, text]);
    
    // Animation
    notif.setScale(0);
    this.tweens.add({
      targets: notif,
      scale: 1,
      duration: 300,
      ease: 'Back.easeOut'
    });
    
    this.tweens.add({
      targets: notif,
      y: 150,
      alpha: 0,
      duration: 500,
      delay: 2000,
      onComplete: () => notif.destroy()
    });
  }

  showComingSoon(feature) {
    this.showNotification(`${feature} - Bientôt disponible!`, 0xff8844);
  }
  
  showMessage(text) {
    const msg = this.add.text(512, 384, text, {
      fontSize: '32px',
      color: '#ffffff',
      backgroundColor: '#ff0000',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5);
    
    this.tweens.add({
      targets: msg,
      alpha: 0,
      y: 340,
      duration: 2000,
      onComplete: () => msg.destroy()
    });
  }

  update() {
    // Pas d'update pour améliorer les performances
  }
}
