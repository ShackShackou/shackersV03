import Phaser from 'phaser';

export class TrainingScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TrainingScene' });
    this.selectedShacker = null;
    this.selectedTraining = null;
    this.trainingInProgress = false;
  }

  preload() {
    // TODO: Charger les assets d'entraînement
  }

  create() {
    // Fond
    this.cameras.main.setBackgroundColor('#2a2a2a');
    
    // Titre
    this.add.text(512, 50, 'Centre d\'Entraînement', {
      fontSize: '42px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5);
    
    // Panneau de sélection des Shackers
    this.createShackerPanel();
    
    // Zone d'entraînement
    this.createTrainingArea();
    
    // Panneau de statistiques
    this.createStatsPanel();
    
    // Bouton retour
    this.createBackButton();
    
    // Charger les Shackers du joueur
    this.loadShackers();
  }
  
  createShackerPanel() {
    // Panneau de gauche pour la liste des Shackers
    const panelBg = this.add.rectangle(150, 400, 250, 600, 0x000000, 0.8);
    panelBg.setStrokeStyle(2, 0xffffff);
    
    this.add.text(150, 130, 'Vos Shackers', {
      fontSize: '24px',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    // Container pour la liste des Shackers
    this.shackerListContainer = this.add.container(150, 200);
  }
  
  createTrainingArea() {
    // Zone centrale d'entraînement
    const areaBg = this.add.rectangle(512, 400, 400, 500, 0x333333, 0.8);
    areaBg.setStrokeStyle(3, 0xffffff);
    
    this.add.text(512, 200, 'Zone d\'Entraînement', {
      fontSize: '28px',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    // Types d'entraînement
    const trainingTypes = [
      { 
        type: 'strength', 
        name: 'Force 💪', 
        y: 300,
        description: '+2 Force, -1 Agilité',
        duration: 300000, // 5 minutes
        cost: 50
      },
      { 
        type: 'agility', 
        name: 'Agilité 🏃', 
        y: 380,
        description: '+2 Agilité, -1 Force',
        duration: 300000,
        cost: 50
      },
      { 
        type: 'speed', 
        name: 'Vitesse ⚡', 
        y: 460,
        description: '+2 Vitesse',
        duration: 600000, // 10 minutes
        cost: 75
      },
      { 
        type: 'endurance', 
        name: 'Endurance 🛡️', 
        y: 540,
        description: '+5 PV Max',
        duration: 900000, // 15 minutes
        cost: 100
      }
    ];
    
    this.trainingButtons = [];
    
    trainingTypes.forEach(training => {
      const button = this.add.rectangle(512, training.y, 300, 60, 0x4444ff);
      button.setInteractive();
      button.setStrokeStyle(2, 0xffffff);
      button.trainingData = training;
      
      const text = this.add.text(512, training.y - 10, training.name, {
        fontSize: '22px',
        color: '#ffffff'
      }).setOrigin(0.5);
      
      const descText = this.add.text(512, training.y + 15, training.description, {
        fontSize: '14px',
        color: '#cccccc'
      }).setOrigin(0.5);
      
      button.on('pointerover', () => {
        if (!this.trainingInProgress) {
          button.setFillStyle(0x6666ff);
          this.showTrainingInfo(training);
        }
      });
      
      button.on('pointerout', () => {
        if (!this.trainingInProgress) {
          button.setFillStyle(0x4444ff);
        }
      });
      
      button.on('pointerdown', () => {
        if (!this.trainingInProgress && this.selectedShacker) {
          this.startTraining(training);
        }
      });
      
      this.trainingButtons.push({ button, text, descText, data: training });
    });
    
    // Zone d'information
    this.trainingInfoText = this.add.text(512, 620, '', {
      fontSize: '16px',
      color: '#ffffff',
      align: 'center',
      wordWrap: { width: 380 }
    }).setOrigin(0.5);
  }
  
  createStatsPanel() {
    // Panneau de droite pour les stats
    const panelBg = this.add.rectangle(874, 400, 250, 600, 0x000000, 0.8);
    panelBg.setStrokeStyle(2, 0xffffff);
    
    this.add.text(874, 130, 'Statistiques', {
      fontSize: '24px',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    // Container pour les stats
    this.statsContainer = this.add.container(874, 200);
  }
  
  async loadShackers() {
    try {
      const token = localStorage.getItem('labrute_token');
      if (!token) return;
      
      const response = await fetch('http://localhost:4000/api/shackers', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const shackers = await response.json();
        this.displayShackers(shackers);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des Shackers:', error);
      // Données de test
      this.displayShackers([
        { 
          id: '1', 
          name: 'Brutus', 
          level: 5, 
          hp: 50, 
          strength: 12, 
          agility: 8, 
          speed: 10,
          fatigue: 0
        }
      ]);
    }
  }
  
  displayShackers(shackers) {
    this.shackerListContainer.removeAll(true);
    
    shackers.forEach((shacker, index) => {
      const y = index * 80;
      
      // Carte du Shacker
      const card = this.add.rectangle(0, y, 220, 70, 0x444444);
      card.setInteractive();
      card.setStrokeStyle(2, 0x888888);
      
      // Nom et niveau
      const nameText = this.add.text(-90, y - 15, `${shacker.name}`, {
        fontSize: '18px',
        color: '#ffffff'
      });
      
      const levelText = this.add.text(-90, y + 5, `Niv. ${shacker.level}`, {
        fontSize: '14px',
        color: '#ffff00'
      });
      
      // Barre de fatigue
      const fatigueBg = this.add.rectangle(30, y + 20, 100, 8, 0x333333);
      const fatigueBar = this.add.rectangle(
        30 - (50 * shacker.fatigue / 100), 
        y + 20, 
        100 * (1 - shacker.fatigue / 100), 
        8, 
        0xff6666
      );
      fatigueBar.setOrigin(0, 0.5);
      
      const fatigueText = this.add.text(90, y + 20, `${100 - shacker.fatigue}%`, {
        fontSize: '12px',
        color: '#ffffff'
      }).setOrigin(0, 0.5);
      
      // Interaction
      card.on('pointerover', () => {
        card.setFillStyle(0x666666);
      });
      
      card.on('pointerout', () => {
        card.setFillStyle(0x444444);
      });
      
      card.on('pointerdown', () => {
        this.selectShacker(shacker, card);
      });
      
      // Ajouter au container
      this.shackerListContainer.add([card, nameText, levelText, fatigueBg, fatigueBar, fatigueText]);
    });
  }
  
  selectShacker(shacker, card) {
    // Désélectionner l'ancien
    if (this.selectedShackerCard) {
      this.selectedShackerCard.setStrokeStyle(2, 0x888888);
    }
    
    // Sélectionner le nouveau
    this.selectedShacker = shacker;
    this.selectedShackerCard = card;
    card.setStrokeStyle(3, 0x00ff00);
    
    // Afficher les stats
    this.displayStats(shacker);
  }
  
  displayStats(shacker) {
    this.statsContainer.removeAll(true);
    
    const stats = [
      { name: 'Force', value: shacker.strength, color: '#ff6666' },
      { name: 'Agilité', value: shacker.agility, color: '#66ff66' },
      { name: 'Vitesse', value: shacker.speed, color: '#6666ff' },
      { name: 'PV Max', value: shacker.hp, color: '#ff66ff' },
      { name: 'Fatigue', value: `${shacker.fatigue || 0}%`, color: '#ffff66' }
    ];
    
    stats.forEach((stat, index) => {
      const y = index * 60;
      
      const nameText = this.add.text(-90, y, stat.name, {
        fontSize: '18px',
        color: '#cccccc'
      });
      
      const valueText = this.add.text(90, y, stat.value.toString(), {
        fontSize: '24px',
        color: stat.color
      }).setOrigin(1, 0);
      
      // Barre de progression pour les stats numériques
      if (typeof stat.value === 'number' && stat.name !== 'Fatigue') {
        const barBg = this.add.rectangle(-90, y + 25, 180, 10, 0x333333);
        barBg.setOrigin(0, 0.5);
        
        const barFill = this.add.rectangle(-90, y + 25, 180 * (stat.value / 30), 10, stat.color);
        barFill.setOrigin(0, 0.5);
        
        this.statsContainer.add([barBg, barFill]);
      }
      
      this.statsContainer.add([nameText, valueText]);
    });
    
    // Historique d'entraînement
    const historyY = 320;
    const historyTitle = this.add.text(0, historyY, 'Historique', {
      fontSize: '20px',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    this.statsContainer.add(historyTitle);
  }
  
  showTrainingInfo(training) {
    const duration = Math.floor(training.duration / 60000);
    this.trainingInfoText.setText(
      `Durée: ${duration} minutes\nCoût: ${training.cost} Or\n${training.description}`
    );
  }
  
  startTraining(training) {
    if (!this.selectedShacker) {
      this.showMessage('Sélectionnez un Shacker !', '#ff0000');
      return;
    }
    
    if (this.selectedShacker.fatigue >= 80) {
      this.showMessage('Ce Shacker est trop fatigué !', '#ff0000');
      return;
    }
    
    // Lancer le mini-jeu interactif correspondant
    this.scene.start('TrainingInteractiveScene', {
      shacker: this.selectedShacker,
      type: training.type
    });
  }
  
  showTrainingProgress(training) {
    // Créer une barre de progression
    if (this.progressBar) this.progressBar.destroy();
    if (this.progressText) this.progressText.destroy();
    
    const progressBg = this.add.rectangle(512, 650, 400, 30, 0x333333);
    progressBg.setStrokeStyle(2, 0xffffff);
    
    this.progressBar = this.add.rectangle(312, 650, 0, 26, 0x00ff00);
    this.progressBar.setOrigin(0, 0.5);
    
    this.progressText = this.add.text(512, 650, 'Entraînement en cours...', {
      fontSize: '16px',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    // Animation de la barre
    this.tweens.add({
      targets: this.progressBar,
      width: 396,
      duration: 5000,
      ease: 'Linear'
    });
  }
  
  completeTraining(training) {
    // Appliquer les gains
    switch(training.type) {
      case 'strength':
        this.selectedShacker.strength += 2;
        this.selectedShacker.agility = Math.max(1, this.selectedShacker.agility - 1);
        break;
      case 'agility':
        this.selectedShacker.agility += 2;
        this.selectedShacker.strength = Math.max(1, this.selectedShacker.strength - 1);
        break;
      case 'speed':
        this.selectedShacker.speed += 2;
        break;
      case 'endurance':
        this.selectedShacker.hp += 5;
        break;
    }
    
    // Augmenter la fatigue
    this.selectedShacker.fatigue = Math.min(100, (this.selectedShacker.fatigue || 0) + 30);
    
    // Réinitialiser l'interface
    this.trainingInProgress = false;
    this.trainingButtons.forEach(btn => {
      btn.button.setFillStyle(0x4444ff);
      btn.button.setInteractive();
    });
    
    // Nettoyer la barre de progression
    if (this.progressBar) this.progressBar.destroy();
    if (this.progressText) this.progressText.destroy();
    
    // Rafraîchir l'affichage
    this.displayStats(this.selectedShacker);
    this.showMessage('Entraînement terminé !', '#00ff00');
    
    // TODO: Sauvegarder sur le serveur
  }
  
  showMessage(text, color) {
    const message = this.add.text(512, 700, text, {
      fontSize: '24px',
      color: color,
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);
    
    this.tweens.add({
      targets: message,
      y: 680,
      alpha: 0,
      duration: 2000,
      onComplete: () => message.destroy()
    });
  }
  
  createBackButton() {
    const backButton = this.add.rectangle(100, 50, 150, 40, 0x4444ff);
    backButton.setInteractive();
    backButton.setStrokeStyle(2, 0xffffff);
    
    const backText = this.add.text(100, 50, '← Retour au Hub', {
      fontSize: '18px',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    backButton.on('pointerover', () => {
      backButton.setFillStyle(0x6666ff);
    });
    
    backButton.on('pointerout', () => {
      backButton.setFillStyle(0x4444ff);
    });
    
    backButton.on('pointerdown', () => {
      this.scene.start('HubScene');
    });
  }
}
