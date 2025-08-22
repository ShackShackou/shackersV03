import Phaser from 'phaser';

export class HubEnhancedScene extends Phaser.Scene {
  constructor() {
    super({ key: 'HubEnhancedScene' });
    
    this.buildings = [];
    this.selectedBuilding = null;
    this.resources = {
      gold: 1000,
      wood: 200,
      stone: 150,
      glory: 50
    };
    
    // Configuration des bâtiments avec style Swords & Souls
    this.buildingConfigs = {
      barracks: {
        name: 'Caserne',
        description: 'Recrutez et gérez vos Shackers',
        position: { x: 200, y: 400 },
        scale: 1.2,
        color: 0x8B4513,
        icon: '⚔️',
        levels: [
          { cost: { gold: 0 }, bonus: 'Max 3 Shackers' },
          { cost: { gold: 500, wood: 100 }, bonus: 'Max 5 Shackers' },
          { cost: { gold: 1500, wood: 300, stone: 200 }, bonus: 'Max 8 Shackers' },
          { cost: { gold: 5000, wood: 800, stone: 600, glory: 50 }, bonus: 'Max 12 Shackers' },
          { cost: { gold: 15000, wood: 2000, stone: 1500, glory: 200 }, bonus: 'Max 20 Shackers' }
        ]
      },
      training: {
        name: 'Centre d\'Entraînement',
        description: 'Entraînez vos Shackers avec des mini-jeux',
        position: { x: 400, y: 350 },
        scale: 1.3,
        color: 0xFF6347,
        icon: '💪',
        levels: [
          { cost: { gold: 0 }, bonus: 'Entraînement basique' },
          { cost: { gold: 800, wood: 150 }, bonus: '+10% XP gagné' },
          { cost: { gold: 2000, wood: 400, stone: 300 }, bonus: '+25% XP gagné' },
          { cost: { gold: 6000, wood: 1000, stone: 800, glory: 100 }, bonus: '+50% XP gagné' },
          { cost: { gold: 20000, wood: 3000, stone: 2500, glory: 500 }, bonus: '+100% XP gagné' }
        ]
      },
      forge: {
        name: 'Forge',
        description: 'Créez et améliorez des armes',
        position: { x: 600, y: 380 },
        scale: 1.1,
        color: 0x696969,
        icon: '🔨',
        levels: [
          { cost: { gold: 0 }, bonus: 'Armes communes' },
          { cost: { gold: 1000, stone: 200 }, bonus: 'Armes rares' },
          { cost: { gold: 3000, stone: 600, wood: 400 }, bonus: 'Armes épiques' },
          { cost: { gold: 10000, stone: 2000, wood: 1500, glory: 200 }, bonus: 'Armes légendaires' },
          { cost: { gold: 30000, stone: 5000, wood: 4000, glory: 1000 }, bonus: 'Armes mythiques' }
        ]
      },
      arena: {
        name: 'Arène',
        description: 'Organisez des tournois et des défis',
        position: { x: 800, y: 400 },
        scale: 1.4,
        color: 0xFFD700,
        icon: '🏟️',
        levels: [
          { cost: { gold: 0 }, bonus: 'Combats 1v1' },
          { cost: { gold: 2000, stone: 500 }, bonus: 'Tournois quotidiens' },
          { cost: { gold: 8000, stone: 2000, glory: 300 }, bonus: 'Tournois hebdomadaires' },
          { cost: { gold: 25000, stone: 5000, glory: 1000 }, bonus: 'Grand Champion' },
          { cost: { gold: 100000, stone: 20000, glory: 5000 }, bonus: 'Arène Légendaire' }
        ]
      },
      market: {
        name: 'Marché',
        description: 'Commercez et échangez des ressources',
        position: { x: 500, y: 500 },
        scale: 1.0,
        color: 0x32CD32,
        icon: '💰',
        levels: [
          { cost: { gold: 0 }, bonus: 'Commerce basique' },
          { cost: { gold: 600, wood: 200 }, bonus: 'Meilleurs prix -10%' },
          { cost: { gold: 2500, wood: 800, stone: 400 }, bonus: 'Meilleurs prix -25%' },
          { cost: { gold: 10000, wood: 3000, stone: 2000, glory: 500 }, bonus: 'Meilleurs prix -40%' },
          { cost: { gold: 50000, wood: 10000, stone: 8000, glory: 3000 }, bonus: 'Prix légendaires -60%' }
        ]
      }
    };
  }

  preload() {
    // Créer des assets temporaires pour les bâtiments
    this.createBuildingAssets();
  }

  create() {
    // Fond avec parallaxe style Swords & Souls
    this.createBackground();
    
    // Effet de lumière ambiante (désactivé si non supporté)
    try {
      this.lights.enable();
      this.lights.setAmbientColor(0x808080);
    } catch (e) {
      console.log('Lights not supported');
    }
    
    // Titre stylisé
    const title = this.add.text(512, 50, 'Votre Domaine', {
      fontSize: '56px',
      fontFamily: 'Arial Black',
      color: '#FFD700',
      stroke: '#8B4513',
      strokeThickness: 8,
      shadow: {
        offsetX: 4,
        offsetY: 4,
        color: '#000000',
        blur: 10,
        fill: true
      }
    }).setOrigin(0.5);
    
    // Animation du titre
    this.tweens.add({
      targets: title,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    // Interface utilisateur améliorée
    this.createEnhancedUI();
    
    // Créer les bâtiments avec animations
    this.createAnimatedBuildings();
    
    // Particules d'ambiance
    this.createAmbientParticles();
    
    // Boutons de navigation
    this.createNavigationButtons();
    
    // Musique d'ambiance (si disponible)
    // this.sound.play('hub-music', { loop: true, volume: 0.5 });
  }
  
  createBuildingAssets() {
    // Pas besoin de créer des textures, on va dessiner directement avec des graphics
  }
  
  createBackground() {
    // Ciel dégradé
    const skyGradient = this.add.graphics();
    for (let i = 0; i < 768; i++) {
      const color = Phaser.Display.Color.Interpolate.ColorWithColor(
        { r: 135, g: 206, b: 235 }, // Bleu ciel
        { r: 255, g: 165, b: 0 },   // Orange coucher de soleil
        768,
        i
      );
      skyGradient.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b));
      skyGradient.fillRect(0, i, 1024, 1);
    }
    
    // Nuages animés
    for (let i = 0; i < 5; i++) {
      const cloud = this.add.ellipse(
        Phaser.Math.Between(0, 1024),
        Phaser.Math.Between(50, 200),
        Phaser.Math.Between(100, 200),
        Phaser.Math.Between(50, 80),
        0xffffff,
        0.3
      );
      
      this.tweens.add({
        targets: cloud,
        x: 1024 + cloud.width,
        duration: Phaser.Math.Between(30000, 60000),
        repeat: -1,
        onRepeat: () => {
          cloud.x = -cloud.width;
          cloud.y = Phaser.Math.Between(50, 200);
        }
      });
    }
    
    // Sol avec texture
    const ground = this.add.rectangle(512, 650, 1024, 300, 0x3B7F3C);
    ground.setStrokeStyle(3, 0x2D5F2E);
    
    // Chemins entre les bâtiments
    const pathGraphics = this.add.graphics();
    pathGraphics.lineStyle(40, 0xD2B48C, 0.6);
    
    // Dessiner des chemins courbes entre les bâtiments
    Object.values(this.buildingConfigs).forEach((building, index) => {
      if (index < Object.values(this.buildingConfigs).length - 1) {
        const nextBuilding = Object.values(this.buildingConfigs)[index + 1];
        
        // Dessiner une ligne courbe simple entre les bâtiments
        const curve = new Phaser.Curves.CubicBezier(
          new Phaser.Math.Vector2(building.position.x, building.position.y),
          new Phaser.Math.Vector2(building.position.x + 50, building.position.y - 30),
          new Phaser.Math.Vector2(nextBuilding.position.x - 50, nextBuilding.position.y - 30),
          new Phaser.Math.Vector2(nextBuilding.position.x, nextBuilding.position.y)
        );
        
        const points = curve.getPoints(32);
        pathGraphics.beginPath();
        pathGraphics.moveTo(points[0].x, points[0].y);
        
        for (let i = 1; i < points.length; i++) {
          pathGraphics.lineTo(points[i].x, points[i].y);
        }
        
        pathGraphics.strokePath();
      }
    });
  }
  
  createEnhancedUI() {
    // Panneau de ressources avec style amélioré
    const resourcePanel = this.add.rectangle(512, 100, 800, 80, 0x000000, 0.8);
    resourcePanel.setStrokeStyle(3, 0xFFD700);
    
    // Conteneur pour les ressources
    const resourceContainer = this.add.container(512, 100);
    
    // Ressources avec icônes animées
    const resourceTypes = [
      { key: 'gold', icon: '💰', color: '#FFD700', x: -300 },
      { key: 'wood', icon: '🪵', color: '#8B4513', x: -100 },
      { key: 'stone', icon: '🪨', color: '#808080', x: 100 },
      { key: 'glory', icon: '⭐', color: '#FF69B4', x: 300 }
    ];
    
    this.resourceTexts = {};
    
    resourceTypes.forEach(res => {
      // Icône
      const icon = this.add.text(res.x - 30, 0, res.icon, {
        fontSize: '32px'
      }).setOrigin(0.5);
      
      // Valeur
      const value = this.add.text(res.x + 20, 0, this.resources[res.key].toString(), {
        fontSize: '28px',
        fontFamily: 'Arial Black',
        color: res.color,
        stroke: '#000000',
        strokeThickness: 3
      }).setOrigin(0.5);
      
      this.resourceTexts[res.key] = value;
      
      // Animation de rebond sur l'icône
      this.tweens.add({
        targets: icon,
        scale: 1.2,
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      
      resourceContainer.add([icon, value]);
    });
  }
  
  createAnimatedBuildings() {
    Object.entries(this.buildingConfigs).forEach(([key, config]) => {
      // Container pour le bâtiment complet
      const buildingContainer = this.add.container(config.position.x, config.position.y);
      
      // Ombre du bâtiment
      const shadow = this.add.ellipse(0, 60, 140, 40, 0x000000, 0.3);
      
      // Bâtiment principal avec graphics
      const buildingGraphics = this.add.graphics();
      const width = 180 * config.scale;
      const height = 200 * config.scale;
      
      // Base du bâtiment
      const baseY = height * 0.4;
      buildingGraphics.fillStyle(config.color, 1);
      buildingGraphics.fillRoundedRect(-width/2 + 15, baseY - height/2, width - 30, height * 0.6, 15);
      
      // Toit
      buildingGraphics.fillStyle(config.color * 0.8, 1);
      buildingGraphics.beginPath();
      buildingGraphics.moveTo(-width/2 + 5, baseY - height/2);
      buildingGraphics.lineTo(0, -height/2 + 20);
      buildingGraphics.lineTo(width/2 - 5, baseY - height/2);
      buildingGraphics.closePath();
      buildingGraphics.fillPath();
      
      // Bordure du toit
      buildingGraphics.lineStyle(3, 0xffffff, 0.3);
      buildingGraphics.strokePath();
      
      // Porte
      buildingGraphics.fillStyle(0x4a2c00, 1);
      buildingGraphics.fillRoundedRect(-25, height/2 - 70, 50, 70, 10);
      
      // Fenêtres
      buildingGraphics.fillStyle(0xffffcc, 0.8);
      buildingGraphics.fillRoundedRect(-width/4 - 17, -20, 34, 34, 5);
      buildingGraphics.fillRoundedRect(width/4 - 17, -20, 34, 34, 5);
      
      // Zone interactive
      const building = this.add.container(0, 0, [buildingGraphics]);
      building.setSize(width, height);
      building.setInteractive();
      
      // Lumière du bâtiment (si supporté)
      let light = null;
      if (this.lights && this.lights.active) {
        light = this.lights.addLight(
          config.position.x, 
          config.position.y - 50, 
          200
        ).setColor(0xffffff).setIntensity(2);
      }
      
      // Icône du bâtiment
      const iconBg = this.add.circle(0, -80, 35, 0x000000, 0.7);
      const icon = this.add.text(0, -80, config.icon, {
        fontSize: '36px'
      }).setOrigin(0.5);
      
      // Nom du bâtiment
      const nameText = this.add.text(0, -120, config.name, {
        fontSize: '20px',
        fontFamily: 'Arial Black',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4
      }).setOrigin(0.5);
      
      // Niveau du bâtiment
      const level = this.registry.get(`building_${key}_level`) || 1;
      const levelText = this.add.text(40, -40, `Niv.${level}`, {
        fontSize: '18px',
        fontFamily: 'Arial',
        color: '#FFD700',
        backgroundColor: '#000000',
        padding: { x: 5, y: 2 }
      }).setOrigin(0.5);
      
      // Animation d'idle du bâtiment
      this.tweens.add({
        targets: building,
        y: -10,
        duration: 2000 + Math.random() * 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      
      // Particules spécifiques au bâtiment
      if (key === 'forge') {
        // Étincelles pour la forge
        const sparks = this.add.particles(0, -30, 'projectile', {
          speed: { min: 50, max: 150 },
          scale: { start: 0.5, end: 0 },
          blendMode: 'ADD',
          lifespan: 500,
          frequency: 200,
          tint: [0xff0000, 0xff8800, 0xffff00]
        });
        buildingContainer.add(sparks);
      } else if (key === 'training') {
        // Aura d'énergie pour l'entraînement
        const aura = this.add.circle(0, 0, 80, 0x00ff00, 0.2);
        this.tweens.add({
          targets: aura,
          scale: 1.3,
          alpha: 0,
          duration: 2000,
          repeat: -1
        });
        buildingContainer.add(aura);
      }
      
      // Ajouter tous les éléments au container
      buildingContainer.add([shadow, building, iconBg, icon, nameText, levelText]);
      
      // Données du bâtiment
      building.buildingData = {
        key,
        config,
        level,
        container: buildingContainer,
        light
      };
      
      // Interactions
      building.on('pointerover', () => {
        building.setScale(1.1);
        if (light) light.setIntensity(3);
        this.showBuildingInfo(building.buildingData);
      });
      
      building.on('pointerout', () => {
        building.setScale(1);
        if (light) light.setIntensity(2);
        this.hideBuildingInfo();
      });
      
      building.on('pointerdown', () => {
        this.selectBuilding(building.buildingData);
      });
      
      this.buildings.push(building);
    });
  }
  
  showBuildingInfo(buildingData) {
    if (this.infoPanel) this.infoPanel.destroy();
    
    this.infoPanel = this.add.container(512, 650);
    
    // Fond du panneau
    const bg = this.add.rectangle(0, 0, 600, 100, 0x000000, 0.8);
    bg.setStrokeStyle(3, 0xFFD700);
    
    // Description
    const desc = this.add.text(0, -20, buildingData.config.description, {
      fontSize: '20px',
      color: '#ffffff',
      align: 'center',
      wordWrap: { width: 550 }
    }).setOrigin(0.5);
    
    // Bonus actuel
    const currentBonus = buildingData.config.levels[buildingData.level - 1].bonus;
    const bonus = this.add.text(0, 20, `Bonus actuel: ${currentBonus}`, {
      fontSize: '16px',
      color: '#00ff00'
    }).setOrigin(0.5);
    
    this.infoPanel.add([bg, desc, bonus]);
    
    // Animation d'apparition
    this.infoPanel.setScale(0.8, 0);
    this.tweens.add({
      targets: this.infoPanel,
      scaleX: 1,
      scaleY: 1,
      duration: 200,
      ease: 'Back.easeOut'
    });
  }
  
  hideBuildingInfo() {
    if (this.infoPanel) {
      this.tweens.add({
        targets: this.infoPanel,
        scaleY: 0,
        duration: 150,
        onComplete: () => {
          this.infoPanel.destroy();
          this.infoPanel = null;
        }
      });
    }
  }
  
  selectBuilding(buildingData) {
    // Animation de sélection
    this.tweens.add({
      targets: buildingData.container,
      scale: 1.2,
      duration: 100,
      yoyo: true
    });
    
    // Ouvrir le menu du bâtiment
    this.openBuildingMenu(buildingData);
  }
  
  openBuildingMenu(buildingData) {
    // Menu spécifique selon le type de bâtiment
    switch (buildingData.key) {
      case 'training':
        this.scene.start('TrainingScene');
        break;
      case 'barracks':
        window.location.href = '/my-shackers.html';
        break;
      case 'arena':
        // TODO: Scène des tournois
        this.showComingSoon('Système de Tournois');
        break;
      case 'forge':
        // TODO: Scène de la forge
        this.showComingSoon('Forge d\'Armes');
        break;
      case 'market':
        // TODO: Scène du marché
        this.showComingSoon('Marché');
        break;
    }
  }
  
  showComingSoon(feature) {
    const popup = this.add.container(512, 384);
    
    const bg = this.add.rectangle(0, 0, 400, 200, 0x000000, 0.9);
    bg.setStrokeStyle(3, 0xFFD700);
    
    const text = this.add.text(0, -30, `${feature}`, {
      fontSize: '32px',
      color: '#FFD700',
      fontFamily: 'Arial Black'
    }).setOrigin(0.5);
    
    const subtext = this.add.text(0, 20, 'Bientôt disponible!', {
      fontSize: '24px',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    popup.add([bg, text, subtext]);
    
    popup.setScale(0);
    this.tweens.add({
      targets: popup,
      scale: 1,
      duration: 300,
      ease: 'Back.easeOut'
    });
    
    this.time.delayedCall(2000, () => {
      this.tweens.add({
        targets: popup,
        scale: 0,
        duration: 200,
        onComplete: () => popup.destroy()
      });
    });
  }
  
  createAmbientParticles() {
    // Note: Les particules sont désactivées temporairement car les textures ne sont pas chargées
    // TODO: Charger les textures de particules dans preload()
    
    // Pour l'instant, créons des animations simples sans particules
    // Créer des "feuilles" animées avec des sprites
    for (let i = 0; i < 5; i++) {
      const leaf = this.add.rectangle(
        Phaser.Math.Between(0, 1024),
        -50,
        20, 20,
        Phaser.Math.RND.pick([0x90EE90, 0x228B22, 0xFFFF00])
      );
      leaf.setAlpha(0.6);
      
      // Animation de chute
      this.tweens.add({
        targets: leaf,
        y: 800,
        x: leaf.x + Phaser.Math.Between(-100, 100),
        angle: 360,
        duration: Phaser.Math.Between(10000, 20000),
        repeat: -1,
        onRepeat: () => {
          leaf.x = Phaser.Math.Between(0, 1024);
          leaf.y = -50;
        }
      });
    }
  }
  
  createNavigationButtons() {
    // Bouton Menu Principal
    this.createNavButton(100, 50, '🏠 Menu', () => {
      window.location.href = '/home.html';
    });
    
    // Bouton Missions
    this.createNavButton(924, 50, '📜 Missions', () => {
      this.showComingSoon('Système de Missions');
    });
    
    // Bouton Succès
    this.createNavButton(924, 100, '🏆 Succès', () => {
      this.showComingSoon('Succès & Trophées');
    });
  }
  
  createNavButton(x, y, text, callback) {
    const button = this.add.container(x, y);
    
    const bg = this.add.rectangle(0, 0, 150, 40, 0x4444ff, 0.8);
    bg.setInteractive();
    bg.setStrokeStyle(2, 0xffffff);
    
    const label = this.add.text(0, 0, text, {
      fontSize: '18px',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    button.add([bg, label]);
    
    bg.on('pointerover', () => {
      bg.setFillStyle(0x6666ff);
      button.setScale(1.05);
    });
    
    bg.on('pointerout', () => {
      bg.setFillStyle(0x4444ff, 0.8);
      button.setScale(1);
    });
    
    bg.on('pointerdown', callback);
    
    return button;
  }
  
  update(time, delta) {
    // Animations continues ou mises à jour
  }
}
