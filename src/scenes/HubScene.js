import Phaser from 'phaser';

export class HubScene extends Phaser.Scene {
  constructor() {
    super({ key: 'HubScene' });
    this.buildings = [];
    this.selectedBuilding = null;
  }

  preload() {
    // TODO: Charger les assets du hub
    // this.load.image('hub-background', 'assets/hub/background.png');
    // this.load.image('building-barracks', 'assets/hub/barracks.png');
    // this.load.image('building-training', 'assets/hub/training.png');
    // this.load.image('building-forge', 'assets/hub/forge.png');
  }

  create() {
    // Configuration de la scène
    this.cameras.main.setBackgroundColor('#87CEEB'); // Ciel bleu
    
    // Titre temporaire
    this.add.text(512, 50, 'HUB - Votre Camp', {
      fontSize: '48px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5);
    
    // Créer l'interface utilisateur
    this.createUI();
    
    // Créer les zones de bâtiments
    this.createBuildingZones();
    
    // Charger les données du joueur
    this.loadPlayerData();
    
    // Bouton retour
    this.createBackButton();
  }
  
  createUI() {
    // Panneau de ressources en haut
    const resourcePanel = this.add.rectangle(512, 100, 800, 60, 0x000000, 0.7);
    
    // Affichage des ressources
    this.goldText = this.add.text(200, 100, '💰 Or: 0', {
      fontSize: '24px',
      color: '#FFD700'
    }).setOrigin(0.5);
    
    this.woodText = this.add.text(400, 100, '🪵 Bois: 0', {
      fontSize: '24px',
      color: '#8B4513'
    }).setOrigin(0.5);
    
    this.stoneText = this.add.text(600, 100, '🪨 Pierre: 0', {
      fontSize: '24px',
      color: '#808080'
    }).setOrigin(0.5);
    
    this.gloryText = this.add.text(800, 100, '⭐ Gloire: 0', {
      fontSize: '24px',
      color: '#FFD700'
    }).setOrigin(0.5);
  }
  
  createBuildingZones() {
    // Disposition isométrique des bâtiments
    const buildingData = [
      { 
        type: 'barracks', 
        name: 'Caserne', 
        x: 300, 
        y: 300, 
        color: 0x654321,
        description: 'Augmente le nombre max de Shackers'
      },
      { 
        type: 'training', 
        name: 'Centre d\'Entraînement', 
        x: 500, 
        y: 300, 
        color: 0xFF6347,
        description: 'Entraîne tes Shackers'
      },
      { 
        type: 'forge', 
        name: 'Forge', 
        x: 700, 
        y: 300, 
        color: 0x696969,
        description: 'Améliore et crée des armes'
      },
      { 
        type: 'infirmary', 
        name: 'Infirmerie', 
        x: 400, 
        y: 450, 
        color: 0xFF0000,
        description: 'Soigne tes combattants'
      },
      { 
        type: 'market', 
        name: 'Marché', 
        x: 600, 
        y: 450, 
        color: 0xFFD700,
        description: 'Achète et vends des objets'
      }
    ];
    
    buildingData.forEach(data => {
      // Créer une zone de bâtiment temporaire (rectangle)
      const building = this.add.rectangle(data.x, data.y, 120, 100, data.color);
      building.setInteractive();
      building.setStrokeStyle(4, 0xffffff);
      
      // Ajouter le nom du bâtiment
      const nameText = this.add.text(data.x, data.y - 60, data.name, {
        fontSize: '16px',
        color: '#ffffff',
        backgroundColor: '#000000',
        padding: { x: 5, y: 2 }
      }).setOrigin(0.5);
      
      // Niveau du bâtiment
      const levelText = this.add.text(data.x, data.y, 'Niv. 1', {
        fontSize: '20px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3
      }).setOrigin(0.5);
      
      // Stocker les références
      building.buildingData = data;
      building.levelText = levelText;
      this.buildings.push(building);
      
      // Interactions
      building.on('pointerover', () => {
        building.setScale(1.1);
        this.showBuildingTooltip(data);
      });
      
      building.on('pointerout', () => {
        building.setScale(1);
        this.hideTooltip();
      });
      
      building.on('pointerdown', () => {
        this.selectBuilding(building);
      });
    });
  }
  
  showBuildingTooltip(buildingData) {
    // Afficher une info-bulle
    if (this.tooltip) this.tooltip.destroy();
    
    this.tooltip = this.add.group([
      this.add.rectangle(512, 600, 400, 80, 0x000000, 0.8),
      this.add.text(512, 600, buildingData.description, {
        fontSize: '20px',
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: 380 }
      }).setOrigin(0.5)
    ]);
  }
  
  hideTooltip() {
    if (this.tooltip) {
      this.tooltip.destroy();
      this.tooltip = null;
    }
  }
  
  selectBuilding(building) {
    // Désélectionner l'ancien bâtiment
    if (this.selectedBuilding) {
      this.selectedBuilding.setStrokeStyle(4, 0xffffff);
    }
    
    // Sélectionner le nouveau
    this.selectedBuilding = building;
    building.setStrokeStyle(4, 0x00ff00);
    
    // Afficher le menu d'action
    this.showBuildingMenu(building.buildingData);
  }
  
  showBuildingMenu(buildingData) {
    // Supprimer l'ancien menu
    if (this.buildingMenu) {
      this.buildingMenu.destroy();
    }
    
    // Créer le panneau de menu
    const menuItems = [];
    
    // Fond du menu
    const menuBg = this.add.rectangle(800, 400, 300, 400, 0x000000, 0.9);
    menuItems.push(menuBg);
    
    // Titre
    const title = this.add.text(800, 250, buildingData.name, {
      fontSize: '28px',
      color: '#ffffff'
    }).setOrigin(0.5);
    menuItems.push(title);
    
    // Actions selon le type de bâtiment
    if (buildingData.type === 'training') {
      // Bouton d'entraînement
      const trainButton = this.createButton(800, 350, 'Entraîner', () => {
        this.scene.start('TrainingScene');
      });
      menuItems.push(...trainButton);
    } else if (buildingData.type === 'barracks') {
      // Bouton pour voir les Shackers
      const viewButton = this.createButton(800, 350, 'Mes Shackers', () => {
        this.scene.start('MyShackersScene');
      });
      menuItems.push(...viewButton);
    } else if (buildingData.type === 'forge') {
      // Bouton pour la forge
      const forgeButton = this.createButton(800, 350, 'Forger', () => {
        // TODO: Implémenter la forge
        console.log('Forge pas encore implémentée');
      });
      menuItems.push(...forgeButton);
    }
    
    // Bouton d'amélioration
    const upgradeButton = this.createButton(800, 420, 'Améliorer', () => {
      this.upgradeBuilding(buildingData);
    });
    menuItems.push(...upgradeButton);
    
    // Bouton fermer
    const closeButton = this.createButton(800, 490, 'Fermer', () => {
      this.buildingMenu.destroy();
      this.buildingMenu = null;
      if (this.selectedBuilding) {
        this.selectedBuilding.setStrokeStyle(4, 0xffffff);
        this.selectedBuilding = null;
      }
    });
    menuItems.push(...closeButton);
    
    this.buildingMenu = this.add.group(menuItems);
  }
  
  createButton(x, y, text, callback) {
    const button = this.add.rectangle(x, y, 200, 40, 0x4444ff);
    button.setInteractive();
    button.setStrokeStyle(2, 0xffffff);
    
    const buttonText = this.add.text(x, y, text, {
      fontSize: '20px',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    button.on('pointerover', () => {
      button.setFillStyle(0x6666ff);
    });
    
    button.on('pointerout', () => {
      button.setFillStyle(0x4444ff);
    });
    
    button.on('pointerdown', callback);
    
    return [button, buttonText];
  }
  
  upgradeBuilding(buildingData) {
    // TODO: Implémenter la logique d'amélioration
    console.log(`Amélioration de ${buildingData.name}`);
    
    // Exemple de coût
    const cost = {
      gold: 100,
      wood: 50,
      stone: 30
    };
    
    // Vérifier si le joueur peut payer
    // Si oui, effectuer l'amélioration
    // Mettre à jour l'affichage
  }
  
  createBackButton() {
    const backButton = this.createButton(100, 50, '← Retour', () => {
      this.scene.start('home'); // Retour au menu principal
    });
  }
  
  async loadPlayerData() {
    try {
      const token = localStorage.getItem('labrute_token');
      if (!token) return;
      
      // TODO: Charger les ressources du joueur depuis l'API
      // Pour l'instant, valeurs de test
      this.updateResourceDisplay({
        gold: 1000,
        wood: 200,
        stone: 150,
        glory: 50
      });
      
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    }
  }
  
  updateResourceDisplay(resources) {
    this.goldText.setText(`💰 Or: ${resources.gold}`);
    this.woodText.setText(`🪵 Bois: ${resources.wood}`);
    this.stoneText.setText(`🪨 Pierre: ${resources.stone}`);
    this.gloryText.setText(`⭐ Gloire: ${resources.glory}`);
  }
  
  update() {
    // Animations ou mises à jour continues si nécessaire
  }
}
