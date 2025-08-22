import Phaser from 'phaser';

export class TrainingInteractiveScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TrainingInteractiveScene' });
    
    // Configuration des mini-jeux
    this.miniGames = {
      strength: {
        name: 'Force - Frappe Rythmique',
        description: 'Frappez au bon moment pour maximiser la puissance!',
        icon: '💪'
      },
      agility: {
        name: 'Agilité - Esquive Rapide',
        description: 'Esquivez les projectiles au bon timing!',
        icon: '🏃'
      },
      speed: {
        name: 'Vitesse - Combo Chain',
        description: 'Enchaînez les actions rapidement!',
        icon: '⚡'
      },
      endurance: {
        name: 'Endurance - Résistance',
        description: 'Maintenez le rythme le plus longtemps possible!',
        icon: '🛡️'
      }
    };
    
    this.currentGame = null;
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.perfectHits = 0;
    this.totalHits = 0;
    this.gameTimer = null;
    this.gameDuration = 30000; // 30 secondes par session
  }

  init(data) {
    this.selectedShacker = data.shacker || null;
    this.trainingType = data.type || 'strength';
  }

  preload() {
    // Créer des textures simples pour les prototypes
    this.createPlaceholderTextures();
  }

  create() {
    // Configuration de la scène
    this.cameras.main.setBackgroundColor('#2a2a2a');
    
    // Titre du mini-jeu
    const gameConfig = this.miniGames[this.trainingType];
    this.add.text(512, 50, gameConfig.name, {
      fontSize: '42px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5);
    
    this.add.text(512, 100, gameConfig.description, {
      fontSize: '20px',
      color: '#cccccc'
    }).setOrigin(0.5);
    
    // Zone de jeu principale
    this.createGameArea();
    
    // UI du jeu
    this.createGameUI();
    
    // Personnage du joueur avec animations Spine (placeholder pour l'instant)
    this.createPlayerCharacter();
    
    // Démarrer le mini-jeu approprié
    this.startMiniGame();
    
    // Bouton retour
    this.createBackButton();
    
    // Timer du jeu
    this.startGameTimer();
  }
  
  createPlaceholderTextures() {
    // Créer des textures temporaires
    const graphics = this.add.graphics();
    
    // Cible pour le timing
    graphics.fillStyle(0xff0000, 1);
    graphics.fillCircle(50, 50, 50);
    graphics.generateTexture('target', 100, 100);
    
    // Zone de frappe parfaite
    graphics.clear();
    graphics.fillStyle(0x00ff00, 0.3);
    graphics.fillRect(0, 0, 100, 100);
    graphics.generateTexture('perfectZone', 100, 100);
    
    // Projectile
    graphics.clear();
    graphics.fillStyle(0xffff00, 1);
    graphics.fillCircle(20, 20, 20);
    graphics.generateTexture('projectile', 40, 40);
    
    graphics.destroy();
  }
  
  createGameArea() {
    // Zone de jeu centrale
    const gameArea = this.add.rectangle(512, 400, 700, 400, 0x333333, 0.5);
    gameArea.setStrokeStyle(3, 0xffffff);
    
    // Zones de timing (style Guitar Hero / DDR)
    this.timingZones = [];
    const positions = [
      { x: 312, y: 400, key: 'A' },
      { x: 462, y: 400, key: 'S' },
      { x: 612, y: 400, key: 'D' },
      { x: 762, y: 400, key: 'F' }
    ];
    
    positions.forEach(pos => {
      // Zone de frappe
      const zone = this.add.circle(pos.x, pos.y, 60, 0x444444, 0.8);
      zone.setStrokeStyle(3, 0x888888);
      
      // Zone parfaite (plus petite)
      const perfectZone = this.add.circle(pos.x, pos.y, 30, 0x00ff00, 0.3);
      perfectZone.setStrokeStyle(2, 0x00ff00);
      
      // Touche associée
      const keyText = this.add.text(pos.x, pos.y, pos.key, {
        fontSize: '32px',
        color: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5);
      
      this.timingZones.push({
        zone,
        perfectZone,
        keyText,
        key: pos.key,
        x: pos.x,
        y: pos.y,
        isActive: false
      });
    });
  }
  
  createGameUI() {
    // Score
    this.scoreText = this.add.text(50, 50, 'Score: 0', {
      fontSize: '28px',
      color: '#ffffff'
    });
    
    // Combo
    this.comboText = this.add.text(50, 90, 'Combo: x0', {
      fontSize: '24px',
      color: '#ffff00'
    });
    
    // Timer
    this.timerText = this.add.text(974, 50, 'Temps: 30s', {
      fontSize: '24px',
      color: '#ffffff'
    }).setOrigin(1, 0);
    
    // Barre de progression
    const progressBg = this.add.rectangle(512, 150, 600, 30, 0x333333);
    progressBg.setStrokeStyle(2, 0xffffff);
    
    this.progressBar = this.add.rectangle(212, 150, 0, 26, 0x00ff88);
    this.progressBar.setOrigin(0, 0.5);
    
    // Messages de feedback
    this.feedbackText = this.add.text(512, 250, '', {
      fontSize: '36px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);
  }
  
  createPlayerCharacter() {
    // Placeholder pour le personnage (sera remplacé par Spine)
    this.player = this.add.sprite(512, 550, 'warrior_idle');
    this.player.setScale(2);
    
    // Créer les animations basiques
    if (this.textures.exists('warrior_idle')) {
      this.anims.create({
        key: 'player_idle',
        frames: this.anims.generateFrameNumbers('warrior_idle', { start: 0, end: 5 }),
        frameRate: 10,
        repeat: -1
      });
      
      this.anims.create({
        key: 'player_attack',
        frames: this.anims.generateFrameNumbers('warrior_attack1', { start: 0, end: 5 }),
        frameRate: 15,
        repeat: 0
      });
      
      this.player.play('player_idle');
    }
  }
  
  startMiniGame() {
    switch (this.trainingType) {
      case 'strength':
        this.startStrengthGame();
        break;
      case 'agility':
        this.startAgilityGame();
        break;
      case 'speed':
        this.startSpeedGame();
        break;
      case 'endurance':
        this.startEnduranceGame();
        break;
    }
  }
  
  startStrengthGame() {
    // Mini-jeu de Force : Frappe rythmique
    this.currentNotes = [];
    this.noteSpeed = 300; // pixels par seconde
    
    // Configurer les inputs
    this.input.keyboard.on('keydown-A', () => this.checkHit(0));
    this.input.keyboard.on('keydown-S', () => this.checkHit(1));
    this.input.keyboard.on('keydown-D', () => this.checkHit(2));
    this.input.keyboard.on('keydown-F', () => this.checkHit(3));
    
    // Générer des notes rythmiques
    this.noteGenerator = this.time.addEvent({
      delay: 1000, // Toutes les secondes au début
      callback: this.generateNote,
      callbackScope: this,
      loop: true
    });
  }
  
  generateNote() {
    const laneIndex = Phaser.Math.Between(0, 3);
    const zone = this.timingZones[laneIndex];
    
    // Créer une note qui descend
    const note = this.add.circle(zone.x, -50, 40, 0xff6666);
    note.setStrokeStyle(3, 0xffffff);
    
    // Animation de la note
    this.tweens.add({
      targets: note,
      y: zone.y,
      duration: 2000 / (1 + this.combo * 0.01), // Accélère avec le combo
      ease: 'Linear',
      onComplete: () => {
        // Raté !
        this.missNote(note);
      }
    });
    
    this.currentNotes.push({
      sprite: note,
      lane: laneIndex,
      targetY: zone.y,
      perfectRange: 30,
      goodRange: 60
    });
  }
  
  checkHit(laneIndex) {
    const zone = this.timingZones[laneIndex];
    
    // Animation visuelle de frappe
    this.tweens.add({
      targets: zone.zone,
      scale: 1.2,
      duration: 100,
      yoyo: true
    });
    
    // Vérifier s'il y a une note dans cette lane
    let hitNote = null;
    let bestDistance = Infinity;
    
    this.currentNotes.forEach((note, index) => {
      if (note.lane === laneIndex) {
        const distance = Math.abs(note.sprite.y - zone.y);
        if (distance < bestDistance && distance < zone.zone.radius) {
          bestDistance = distance;
          hitNote = { note, index };
        }
      }
    });
    
    if (hitNote) {
      const distance = bestDistance;
      let points = 0;
      let feedback = '';
      
      if (distance <= 30) {
        // Parfait !
        points = 100 * (1 + this.combo * 0.1);
        feedback = 'PARFAIT!';
        this.perfectHits++;
        this.combo++;
        this.showFeedback(feedback, 0x00ff00);
      } else if (distance <= 60) {
        // Bien !
        points = 50 * (1 + this.combo * 0.05);
        feedback = 'BIEN!';
        this.combo++;
        this.showFeedback(feedback, 0xffff00);
      } else {
        // Manqué
        feedback = 'MANQUÉ!';
        this.combo = 0;
        this.showFeedback(feedback, 0xff0000);
      }
      
      this.score += Math.floor(points);
      this.totalHits++;
      
      // Animation du personnage
      if (this.player && this.player.anims) {
        this.player.play('player_attack', true);
        this.time.delayedCall(400, () => {
          this.player.play('player_idle', true);
        });
      }
      
      // Supprimer la note
      hitNote.note.sprite.destroy();
      this.currentNotes.splice(hitNote.index, 1);
      
      // Mettre à jour l'UI
      this.updateUI();
    }
  }
  
  missNote(noteSprite) {
    noteSprite.destroy();
    this.combo = 0;
    this.showFeedback('RATÉ!', 0xff0000);
    this.updateUI();
    
    // Retirer la note de la liste
    this.currentNotes = this.currentNotes.filter(n => n.sprite !== noteSprite);
  }
  
  showFeedback(text, color) {
    this.feedbackText.setText(text);
    this.feedbackText.setColor('#' + color.toString(16).padStart(6, '0'));
    this.feedbackText.setScale(0.5);
    
    this.tweens.add({
      targets: this.feedbackText,
      scale: 1.2,
      alpha: 1,
      duration: 200,
      yoyo: true,
      onComplete: () => {
        this.tweens.add({
          targets: this.feedbackText,
          alpha: 0,
          duration: 300,
          delay: 200
        });
      }
    });
  }
  
  updateUI() {
    this.scoreText.setText(`Score: ${this.score}`);
    this.comboText.setText(`Combo: x${this.combo}`);
    
    if (this.combo > this.maxCombo) {
      this.maxCombo = this.combo;
    }
    
    // Mettre à jour la barre de progression
    const progress = this.score / 10000; // Objectif de 10000 points
    this.progressBar.width = Math.min(596, progress * 596);
  }
  
  startGameTimer() {
    let timeLeft = this.gameDuration / 1000;
    
    this.gameTimer = this.time.addEvent({
      delay: 1000,
      callback: () => {
        timeLeft--;
        this.timerText.setText(`Temps: ${timeLeft}s`);
        
        if (timeLeft <= 0) {
          this.endGame();
        }
      },
      repeat: this.gameDuration / 1000 - 1
    });
  }
  
  endGame() {
    // Arrêter la génération de notes
    if (this.noteGenerator) {
      this.noteGenerator.destroy();
    }
    
    // Nettoyer les notes restantes
    this.currentNotes.forEach(note => note.sprite.destroy());
    this.currentNotes = [];
    
    // Calculer les récompenses
    const accuracy = this.totalHits > 0 ? (this.perfectHits / this.totalHits) * 100 : 0;
    const bonus = Math.floor(this.score * (accuracy / 100));
    const totalScore = this.score + bonus;
    
    // Afficher les résultats
    this.showResults(totalScore, accuracy);
  }
  
  showResults(totalScore, accuracy) {
    // Fond semi-transparent
    const overlay = this.add.rectangle(512, 384, 1024, 768, 0x000000, 0.8);
    
    // Panneau de résultats
    const panel = this.add.rectangle(512, 384, 600, 400, 0x222222);
    panel.setStrokeStyle(3, 0xffffff);
    
    // Titre
    this.add.text(512, 250, 'Entraînement Terminé!', {
      fontSize: '36px',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    // Stats
    const stats = [
      `Score Final: ${totalScore}`,
      `Précision: ${accuracy.toFixed(1)}%`,
      `Combo Max: x${this.maxCombo}`,
      `Coups Parfaits: ${this.perfectHits}`
    ];
    
    stats.forEach((stat, index) => {
      this.add.text(512, 320 + index * 40, stat, {
        fontSize: '24px',
        color: '#ffffff'
      }).setOrigin(0.5);
    });
    
    // Récompenses
    const xpGained = Math.floor(totalScore / 100);
    const goldGained = Math.floor(totalScore / 50);
    
    this.add.text(512, 480, `+${xpGained} XP | +${goldGained} Or`, {
      fontSize: '28px',
      color: '#00ff88'
    }).setOrigin(0.5);
    
    // Boutons
    const retryButton = this.createResultButton(400, 550, 'Recommencer', () => {
      this.scene.restart({ shacker: this.selectedShacker, type: this.trainingType });
    });
    
    const backButton = this.createResultButton(624, 550, 'Retour', () => {
      this.scene.start('TrainingScene');
    });
    
    // Appliquer les gains au Shacker
    if (this.selectedShacker) {
      this.applyTrainingGains(xpGained);
    }
  }
  
  createResultButton(x, y, text, callback) {
    const button = this.add.rectangle(x, y, 180, 50, 0x4444ff);
    button.setInteractive();
    button.setStrokeStyle(2, 0xffffff);
    
    const buttonText = this.add.text(x, y, text, {
      fontSize: '20px',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    button.on('pointerover', () => button.setFillStyle(0x6666ff));
    button.on('pointerout', () => button.setFillStyle(0x4444ff));
    button.on('pointerdown', callback);
    
    return button;
  }
  
  applyTrainingGains(xp) {
    // Appliquer les gains selon le type d'entraînement
    switch (this.trainingType) {
      case 'strength':
        this.selectedShacker.strength += Math.floor(xp / 50);
        break;
      case 'agility':
        this.selectedShacker.agility += Math.floor(xp / 50);
        break;
      case 'speed':
        this.selectedShacker.speed += Math.floor(xp / 50);
        break;
      case 'endurance':
        this.selectedShacker.hp += Math.floor(xp / 20);
        break;
    }
    
    // TODO: Sauvegarder sur le serveur
  }
  
  createBackButton() {
    const backButton = this.add.rectangle(100, 50, 150, 40, 0x4444ff);
    backButton.setInteractive();
    backButton.setStrokeStyle(2, 0xffffff);
    
    const backText = this.add.text(100, 50, '← Retour', {
      fontSize: '18px',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    backButton.on('pointerover', () => backButton.setFillStyle(0x6666ff));
    backButton.on('pointerout', () => backButton.setFillStyle(0x4444ff));
    backButton.on('pointerdown', () => {
      if (this.gameTimer) this.gameTimer.destroy();
      if (this.noteGenerator) this.noteGenerator.destroy();
      this.scene.start('TrainingScene');
    });
  }
  
  // Mini-jeux additionnels (à implémenter)
  
  startAgilityGame() {
    // Mini-jeu d'Agilité : Esquive de projectiles
    // TODO: Implémenter le système d'esquive avec timing précis
    this.add.text(512, 300, 'Mini-jeu d\'Agilité\n(En développement)', {
      fontSize: '32px',
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5);
  }
  
  startSpeedGame() {
    // Mini-jeu de Vitesse : Enchaînement rapide de combos
    // TODO: Implémenter le système de combos rapides
    this.add.text(512, 300, 'Mini-jeu de Vitesse\n(En développement)', {
      fontSize: '32px',
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5);
  }
  
  startEnduranceGame() {
    // Mini-jeu d'Endurance : Maintenir le rythme
    // TODO: Implémenter le système d'endurance
    this.add.text(512, 300, 'Mini-jeu d\'Endurance\n(En développement)', {
      fontSize: '32px',
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5);
  }
  
  update(time, delta) {
    // Mettre à jour les éléments du jeu si nécessaire
  }
}
