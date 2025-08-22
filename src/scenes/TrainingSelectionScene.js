import Phaser from 'phaser';

export class TrainingSelectionScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TrainingSelectionScene' });
  }

  init(data) {
    this.playerData = data.playerData || {};
    this.activities = data.activities || ['Mêlée', 'Distance', 'Défense', 'Agilité', 'Magie'];
  }

  create() {
    // Fond
    this.cameras.main.setBackgroundColor('#2a2a2a');
    
    // Titre
    const title = this.add.text(512, 50, 'Centre d\'Entraînement', {
      fontSize: '48px',
      color: '#FFD700',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5);
    
    // Animation du titre
    this.tweens.add({
      targets: title,
      scale: { from: 0.8, to: 1.1 },
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    // Créer les cartes d'entraînement
    this.createTrainingCards();
    
    // Bouton retour
    this.createBackButton();
    
    // Stats actuelles
    this.showCurrentStats();
  }

  createTrainingCards() {
    const trainings = [
      {
        type: 'melee',
        name: 'Entraînement de Mêlée',
        icon: '⚔️',
        description: 'Frappez les cibles au bon moment!\nAméliore: Force',
        color: 0xff6347,
        position: { x: 200, y: 300 }
      },
      {
        type: 'range',
        name: 'Entraînement à Distance',
        icon: '🏹',
        description: 'Tirez sur les cibles mouvantes!\nAméliore: Précision',
        color: 0x32cd32,
        position: { x: 400, y: 300 }
      },
      {
        type: 'defense',
        name: 'Entraînement de Défense',
        icon: '🛡️',
        description: 'Bloquez les attaques!\nAméliore: Défense',
        color: 0x4169e1,
        position: { x: 600, y: 300 }
      },
      {
        type: 'agility',
        name: 'Entraînement d\'Agilité',
        icon: '🏃',
        description: 'Esquivez les obstacles!\nAméliore: Agilité',
        color: 0xffd700,
        position: { x: 800, y: 300 }
      },
      {
        type: 'magic',
        name: 'Entraînement Magique',
        icon: '✨',
        description: 'Lancez des sorts!\nAméliore: Magie',
        color: 0x9370db,
        position: { x: 500, y: 500 }
      }
    ];
    
    trainings.forEach((training, index) => {
      const card = this.add.container(training.position.x, training.position.y);
      
      // Fond de la carte
      const bg = this.add.rectangle(0, 0, 180, 250, training.color, 0.8);
      bg.setStrokeStyle(3, 0xffffff);
      bg.setInteractive();
      
      // Icône
      const icon = this.add.text(0, -70, training.icon, {
        fontSize: '64px'
      }).setOrigin(0.5);
      
      // Nom
      const name = this.add.text(0, -20, training.name, {
        fontSize: '18px',
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: 160 }
      }).setOrigin(0.5);
      
      // Description
      const desc = this.add.text(0, 40, training.description, {
        fontSize: '14px',
        color: '#dddddd',
        align: 'center',
        wordWrap: { width: 160 }
      }).setOrigin(0.5);
      
      // Record personnel
      const record = this.getPersonalRecord(training.type);
      const recordText = this.add.text(0, 100, `Record: ${record}`, {
        fontSize: '16px',
        color: '#88ff88'
      }).setOrigin(0.5);
      
      card.add([bg, icon, name, desc, recordText]);
      
      // Effets d'interaction
      bg.on('pointerover', () => {
        this.tweens.add({
          targets: card,
          scale: 1.1,
          duration: 200,
          ease: 'Power2'
        });
        bg.setFillStyle(training.color);
      });
      
      bg.on('pointerout', () => {
        this.tweens.add({
          targets: card,
          scale: 1,
          duration: 200,
          ease: 'Power2'
        });
        bg.setFillStyle(training.color, 0.8);
      });
      
      bg.on('pointerdown', () => {
        this.startTraining(training);
      });
      
      // Animation d'entrée
      card.setScale(0);
      this.tweens.add({
        targets: card,
        scale: 1,
        duration: 500,
        delay: index * 100,
        ease: 'Back.easeOut'
      });
    });
  }

  getPersonalRecord(type) {
    // Récupérer le record depuis les données sauvegardées
    const records = {
      melee: 2500,
      range: 1800,
      defense: 3200,
      agility: 2100,
      magic: 1500
    };
    return records[type] || 0;
  }

  startTraining(training) {
    // Flash effect
    const flash = this.add.rectangle(512, 384, 1024, 768, 0xffffff, 0);
    this.tweens.add({
      targets: flash,
      alpha: 1,
      duration: 200,
      yoyo: true,
      onComplete: () => {
        flash.destroy();
        
        // Lancer la scène d'entraînement appropriée
        switch(training.type) {
          case 'melee':
            // Vérifier si la scène existe
            if (this.scene.manager.keys['MeleeTrainingScene']) {
              this.scene.start('MeleeTrainingScene', { 
                playerData: this.playerData,
                trainingType: training.type 
              });
            } else {
              console.error('MeleeTrainingScene non trouvée!');
              this.showMessage('Erreur: Mini-jeu non chargé');
            }
            break;
          case 'range':
            this.scene.start('RangeTrainingScene', { 
              playerData: this.playerData,
              trainingType: training.type 
            });
            break;
          case 'defense':
            this.scene.start('DefenseTrainingScene', { 
              playerData: this.playerData,
              trainingType: training.type 
            });
            break;
          case 'agility':
            this.scene.start('AgilityTrainingScene', { 
              playerData: this.playerData,
              trainingType: training.type 
            });
            break;
          case 'magic':
            this.scene.start('MagicTrainingScene', { 
              playerData: this.playerData,
              trainingType: training.type 
            });
            break;
          default:
            // Message temporaire
            this.showMessage('Mini-jeu en développement!');
            break;
        }
      }
    });
  }

  showCurrentStats() {
    const statsContainer = this.add.container(512, 650);
    
    const bg = this.add.rectangle(0, 0, 600, 80, 0x000000, 0.7);
    bg.setStrokeStyle(2, 0xffffff);
    
    const stats = this.playerData.stats || {
      strength: 10,
      agility: 10,
      defense: 10,
      magic: 5
    };
    
    const statsText = this.add.text(0, 0, [
      `⚔️ Force: ${stats.strength}`,
      `🏃 Agilité: ${stats.agility}`,
      `🛡️ Défense: ${stats.defense}`,
      `✨ Magie: ${stats.magic}`
    ].join('   '), {
      fontSize: '24px',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    statsContainer.add([bg, statsText]);
    
    // Animation d'apparition
    statsContainer.setAlpha(0);
    this.tweens.add({
      targets: statsContainer,
      alpha: 1,
      y: 630,
      duration: 500,
      delay: 500,
      ease: 'Power2'
    });
  }

  createBackButton() {
    const backBtn = this.add.rectangle(100, 50, 150, 40, 0x4444ff);
    backBtn.setInteractive();
    backBtn.setStrokeStyle(2, 0xffffff);
    
    this.add.text(100, 50, '← Retour', {
      fontSize: '20px',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    backBtn.on('pointerover', () => backBtn.setFillStyle(0x6666ff));
    backBtn.on('pointerout', () => backBtn.setFillStyle(0x4444ff));
    backBtn.on('pointerdown', () => {
      this.scene.start('HubUltraScene');
    });
  }
  
  showMessage(text) {
    const msg = this.add.text(512, 400, text, {
      fontSize: '32px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5);
    
    this.tweens.add({
      targets: msg,
      alpha: 0,
      y: 350,
      duration: 2000,
      onComplete: () => msg.destroy()
    });
  }
}
