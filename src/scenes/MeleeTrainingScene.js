import Phaser from 'phaser';

export class MeleeTrainingScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MeleeTrainingScene' });
    
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.timeLeft = 60;
    this.isPlaying = false;
    this.perfectHits = 0;
    
    // Zones de frappe
    this.hitZones = {
      left: { x: 312, y: 384, angle: 180 },
      up: { x: 512, y: 184, angle: 270 },
      right: { x: 712, y: 384, angle: 0 },
      down: { x: 512, y: 584, angle: 90 }
    };
    
    this.projectiles = [];
    this.currentWave = 0;
    this.wavePatterns = [
      { interval: 1500, speed: 300, types: ['apple'] },
      { interval: 1200, speed: 350, types: ['apple', 'shuriken'] },
      { interval: 1000, speed: 400, types: ['apple', 'shuriken', 'magic'] },
      { interval: 800, speed: 450, types: ['apple', 'shuriken', 'magic', 'golden'] }
    ];
  }

  init(data) {
    this.playerData = data.playerData || {};
  }

  create() {
    // Fond d'entraînement
    this.createTrainingArena();
    
    // Personnage au centre
    this.createHero();
    
    // Zones de frappe
    this.createHitZones();
    
    // UI
    this.createUI();
    
    // Contrôles
    this.setupControls();
    
    // Démarrer après un délai
    this.time.delayedCall(1000, () => this.startTraining());
  }

  createTrainingArena() {
    // Fond dégradé
    const graphics = this.add.graphics();
    for (let i = 0; i < 768; i++) {
      const color = Phaser.Display.Color.Interpolate.ColorWithColor(
        { r: 139, g: 69, b: 19 },
        { r: 205, g: 133, b: 63 },
        768,
        i
      );
      graphics.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b));
      graphics.fillRect(0, i, 1024, 1);
    }
    
    // Cercle d'entraînement
    const circle = this.add.circle(512, 384, 250, 0x000000, 0.2);
    circle.setStrokeStyle(4, 0xffffff, 0.5);
    
    // Lignes directionnelles
    const lines = this.add.graphics();
    lines.lineStyle(2, 0xffffff, 0.3);
    
    // Ligne horizontale
    lines.beginPath();
    lines.moveTo(262, 384);
    lines.lineTo(762, 384);
    lines.strokePath();
    
    // Ligne verticale
    lines.beginPath();
    lines.moveTo(512, 134);
    lines.lineTo(512, 634);
    lines.strokePath();
  }

  createHero() {
    // Container pour le héros
    this.hero = this.add.container(512, 384);
    
    // Corps du héros
    const body = this.add.circle(0, 0, 40, 0xff6347);
    const head = this.add.circle(0, -50, 30, 0xffdbac);
    
    // Épée
    this.sword = this.add.rectangle(50, 0, 80, 10, 0xc0c0c0);
    this.sword.setOrigin(0, 0.5);
    
    this.hero.add([body, head, this.sword]);
    
    // État d'animation
    this.hero.isAttacking = false;
  }

  createHitZones() {
    Object.entries(this.hitZones).forEach(([direction, zone]) => {
      // Cercle de la zone
      const zoneCircle = this.add.circle(zone.x, zone.y, 50, 0x00ff00, 0.3);
      zoneCircle.setStrokeStyle(3, 0x00ff00, 0.5);
      
      // Indicateur de direction
      const arrow = this.add.text(zone.x, zone.y, '▶', {
        fontSize: '32px',
        color: '#ffffff'
      }).setOrigin(0.5);
      arrow.setAngle(zone.angle);
      
      // Zone parfaite (plus petite)
      const perfectZone = this.add.circle(zone.x, zone.y, 25, 0xffd700, 0.2);
      perfectZone.setStrokeStyle(2, 0xffd700, 0.8);
      
      zone.graphics = { circle: zoneCircle, arrow, perfectZone };
    });
  }

  createUI() {
    // Barre du haut
    const topBar = this.add.rectangle(512, 40, 1024, 80, 0x000000, 0.7);
    
    // Score
    this.scoreText = this.add.text(50, 40, 'Score: 0', {
      fontSize: '32px',
      color: '#ffffff'
    }).setOrigin(0, 0.5);
    
    // Combo
    this.comboText = this.add.text(300, 40, 'Combo: x0', {
      fontSize: '28px',
      color: '#ffff00'
    }).setOrigin(0, 0.5);
    
    // Timer
    this.timerText = this.add.text(512, 40, 'Temps: 60', {
      fontSize: '32px',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    // Coups parfaits
    this.perfectText = this.add.text(750, 40, '⭐ Parfaits: 0', {
      fontSize: '24px',
      color: '#ffd700'
    }).setOrigin(0, 0.5);
    
    // Instructions
    this.add.text(512, 700, 'Utilisez ← ↑ → ↓ ou A W D S pour frapper!', {
      fontSize: '20px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 }
    }).setOrigin(0.5);
  }

  setupControls() {
    // Touches directionnelles
    this.cursors = this.input.keyboard.createCursorKeys();
    
    // WASD
    this.keys = this.input.keyboard.addKeys({
      w: Phaser.Input.Keyboard.KeyCodes.W,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      s: Phaser.Input.Keyboard.KeyCodes.S,
      d: Phaser.Input.Keyboard.KeyCodes.D
    });
    
    // Gestionnaire d'input
    this.input.keyboard.on('keydown', (event) => {
      if (!this.isPlaying || this.hero.isAttacking) return;
      
      let direction = null;
      
      switch(event.keyCode) {
        case Phaser.Input.Keyboard.KeyCodes.LEFT:
        case Phaser.Input.Keyboard.KeyCodes.A:
          direction = 'left';
          break;
        case Phaser.Input.Keyboard.KeyCodes.UP:
        case Phaser.Input.Keyboard.KeyCodes.W:
          direction = 'up';
          break;
        case Phaser.Input.Keyboard.KeyCodes.RIGHT:
        case Phaser.Input.Keyboard.KeyCodes.D:
          direction = 'right';
          break;
        case Phaser.Input.Keyboard.KeyCodes.DOWN:
        case Phaser.Input.Keyboard.KeyCodes.S:
          direction = 'down';
          break;
      }
      
      if (direction) {
        this.performAttack(direction);
      }
    });
  }

  startTraining() {
    this.isPlaying = true;
    
    // Timer
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.timeLeft--;
        this.timerText.setText(`Temps: ${this.timeLeft}`);
        
        if (this.timeLeft <= 0) {
          this.endTraining();
        }
      },
      callbackScope: this,
      loop: true
    });
    
    // Spawner de projectiles
    this.startProjectileSpawner();
    
    // Augmenter la difficulté progressivement
    this.difficultyTimer = this.time.addEvent({
      delay: 15000,
      callback: () => {
        if (this.currentWave < this.wavePatterns.length - 1) {
          this.currentWave++;
          this.showWaveNotification();
        }
      },
      callbackScope: this,
      loop: true
    });
  }

  startProjectileSpawner() {
    this.projectileSpawner = this.time.addEvent({
      delay: () => this.wavePatterns[this.currentWave].interval,
      callback: () => this.spawnProjectile(),
      callbackScope: this,
      loop: true
    });
  }

  spawnProjectile() {
    const directions = ['left', 'up', 'right', 'down'];
    const direction = Phaser.Math.RND.pick(directions);
    const zone = this.hitZones[direction];
    
    // Type de projectile
    const types = this.wavePatterns[this.currentWave].types;
    const type = Phaser.Math.RND.pick(types);
    
    // Position de départ (hors écran)
    let startX, startY;
    const distance = 400;
    
    switch(direction) {
      case 'left':
        startX = zone.x - distance;
        startY = zone.y;
        break;
      case 'right':
        startX = zone.x + distance;
        startY = zone.y;
        break;
      case 'up':
        startX = zone.x;
        startY = zone.y - distance;
        break;
      case 'down':
        startX = zone.x;
        startY = zone.y + distance;
        break;
    }
    
    // Créer le projectile
    const projectile = this.createProjectileSprite(startX, startY, type);
    projectile.direction = direction;
    projectile.type = type;
    
    // Animation vers la zone
    const speed = this.wavePatterns[this.currentWave].speed;
    const duration = (distance / speed) * 1000;
    
    this.tweens.add({
      targets: projectile,
      x: zone.x,
      y: zone.y,
      duration: duration,
      onComplete: () => {
        // Si le projectile atteint la zone sans être frappé
        if (projectile.active) {
          this.onProjectileMissed(projectile);
        }
      }
    });
    
    this.projectiles.push(projectile);
  }

  createProjectileSprite(x, y, type) {
    let projectile;
    
    switch(type) {
      case 'apple':
        projectile = this.add.circle(x, y, 20, 0xff0000);
        projectile.setStrokeStyle(2, 0xaa0000);
        break;
      case 'shuriken':
        projectile = this.add.star(x, y, 4, 15, 25, 0x888888);
        projectile.setStrokeStyle(2, 0x444444);
        // Rotation
        this.tweens.add({
          targets: projectile,
          angle: 360,
          duration: 1000,
          repeat: -1
        });
        break;
      case 'magic':
        projectile = this.add.circle(x, y, 25, 0x9370db, 0.7);
        projectile.setStrokeStyle(3, 0x9370db);
        // Pulsation
        this.tweens.add({
          targets: projectile,
          scale: { from: 0.8, to: 1.2 },
          duration: 500,
          yoyo: true,
          repeat: -1
        });
        break;
      case 'golden':
        projectile = this.add.star(x, y, 5, 20, 30, 0xffd700);
        projectile.setStrokeStyle(3, 0xffaa00);
        // Brillance
        this.tweens.add({
          targets: projectile,
          alpha: { from: 0.6, to: 1 },
          duration: 300,
          yoyo: true,
          repeat: -1
        });
        break;
    }
    
    projectile.type = type;
    return projectile;
  }

  performAttack(direction) {
    if (this.hero.isAttacking) return;
    
    this.hero.isAttacking = true;
    const zone = this.hitZones[direction];
    
    // Animation de l'épée
    this.tweens.add({
      targets: this.sword,
      angle: zone.angle - 90,
      duration: 100,
      yoyo: true,
      onComplete: () => {
        this.hero.isAttacking = false;
        this.sword.angle = 0;
      }
    });
    
    // Vérifier les hits
    let hitAny = false;
    const perfectHitDistance = 25;
    const normalHitDistance = 50;
    
    this.projectiles.forEach(projectile => {
      if (!projectile.active || projectile.direction !== direction) return;
      
      const distance = Phaser.Math.Distance.Between(
        projectile.x, projectile.y,
        zone.x, zone.y
      );
      
      if (distance <= normalHitDistance) {
        hitAny = true;
        const isPerfect = distance <= perfectHitDistance;
        this.onProjectileHit(projectile, isPerfect);
      }
    });
    
    if (!hitAny) {
      this.onMissedSwing();
    }
  }

  onProjectileHit(projectile, isPerfect) {
    projectile.active = false;
    
    // Points
    let points = 100;
    if (projectile.type === 'shuriken') points = 150;
    if (projectile.type === 'magic') points = 200;
    if (projectile.type === 'golden') points = 500;
    
    if (isPerfect) {
      points *= 2;
      this.perfectHits++;
      this.perfectText.setText(`⭐ Parfaits: ${this.perfectHits}`);
    }
    
    // Combo
    this.combo++;
    points *= (1 + this.combo * 0.1);
    
    this.score += Math.floor(points);
    this.updateUI();
    
    // Effets visuels
    this.createHitEffect(projectile.x, projectile.y, isPerfect, points);
    
    // Détruire le projectile
    projectile.destroy();
    this.projectiles = this.projectiles.filter(p => p !== projectile);
  }

  onProjectileMissed(projectile) {
    projectile.active = false;
    
    // Briser le combo
    this.combo = 0;
    this.updateUI();
    
    // Effet de miss
    this.createMissEffect(projectile.x, projectile.y);
    
    // Flash rouge
    this.cameras.main.flash(200, 255, 0, 0, true);
    
    projectile.destroy();
    this.projectiles = this.projectiles.filter(p => p !== projectile);
  }

  onMissedSwing() {
    // Petit malus pour un swing dans le vide
    if (this.combo > 0) {
      this.combo = Math.floor(this.combo / 2);
      this.updateUI();
    }
  }

  createHitEffect(x, y, isPerfect, points) {
    // Créer une texture simple pour les particules
    if (!this.textures.exists('hit-particle')) {
      const graphics = this.make.graphics({ x: 0, y: 0, add: false });
      graphics.fillStyle(0xffffff, 1);
      graphics.fillCircle(8, 8, 8);
      graphics.generateTexture('hit-particle', 16, 16);
      graphics.destroy();
    }
    
    // Particules
    const emitter = this.add.particles(x, y, 'hit-particle', {
      scale: { start: 0.5, end: 0 },
      speed: { min: 100, max: 200 },
      lifespan: 500,
      quantity: isPerfect ? 10 : 5,
      tint: isPerfect ? 0xffd700 : 0xffffff
    });
    
    this.time.delayedCall(500, () => emitter.destroy());
    
    // Texte de points
    const pointsText = this.add.text(x, y, `+${Math.floor(points)}`, {
      fontSize: isPerfect ? '32px' : '24px',
      color: isPerfect ? '#ffd700' : '#ffffff',
      fontStyle: isPerfect ? 'bold' : 'normal'
    }).setOrigin(0.5);
    
    this.tweens.add({
      targets: pointsText,
      y: y - 50,
      alpha: 0,
      duration: 1000,
      onComplete: () => pointsText.destroy()
    });
    
    // Son (si vous avez des sons)
    // this.sound.play(isPerfect ? 'perfect-hit' : 'hit');
  }

  createMissEffect(x, y) {
    const missText = this.add.text(x, y, 'MISS!', {
      fontSize: '28px',
      color: '#ff0000',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    this.tweens.add({
      targets: missText,
      scale: 1.5,
      alpha: 0,
      duration: 500,
      onComplete: () => missText.destroy()
    });
  }

  updateUI() {
    this.scoreText.setText(`Score: ${this.score}`);
    this.comboText.setText(`Combo: x${this.combo}`);
    
    if (this.combo > this.maxCombo) {
      this.maxCombo = this.combo;
    }
    
    // Couleur du combo selon la valeur
    if (this.combo >= 50) {
      this.comboText.setColor('#ff00ff');
    } else if (this.combo >= 20) {
      this.comboText.setColor('#ffd700');
    } else if (this.combo >= 10) {
      this.comboText.setColor('#ffff00');
    } else {
      this.comboText.setColor('#ffffff');
    }
  }

  showWaveNotification() {
    const waveText = this.add.text(512, 200, `Vague ${this.currentWave + 1}!`, {
      fontSize: '48px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5);
    
    this.tweens.add({
      targets: waveText,
      scale: { from: 0, to: 1.5 },
      alpha: { from: 0, to: 1 },
      duration: 500,
      ease: 'Back.easeOut',
      hold: 1000,
      yoyo: true,
      onComplete: () => waveText.destroy()
    });
  }

  endTraining() {
    this.isPlaying = false;
    
    // Arrêter les timers
    if (this.timerEvent) this.timerEvent.destroy();
    if (this.projectileSpawner) this.projectileSpawner.destroy();
    if (this.difficultyTimer) this.difficultyTimer.destroy();
    
    // Nettoyer les projectiles
    this.projectiles.forEach(p => p.destroy());
    this.projectiles = [];
    
    // Calculer les récompenses
    const xpGained = Math.floor(this.score / 10);
    const goldGained = Math.floor(this.score / 20);
    const statGained = Math.floor(this.perfectHits / 5);
    
    // Afficher les résultats
    this.showResults(xpGained, goldGained, statGained);
  }

  showResults(xp, gold, stat) {
    // Fond sombre
    const overlay = this.add.rectangle(512, 384, 1024, 768, 0x000000, 0.8);
    
    // Fenêtre de résultats
    const resultWindow = this.add.container(512, 384);
    
    const bg = this.add.rectangle(0, 0, 600, 500, 0x2a2a2a);
    bg.setStrokeStyle(3, 0xffffff);
    
    const title = this.add.text(0, -200, 'Entraînement Terminé!', {
      fontSize: '48px',
      color: '#FFD700',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // Stats
    const stats = [
      `Score Final: ${this.score}`,
      `Combo Maximum: ${this.maxCombo}`,
      `Coups Parfaits: ${this.perfectHits}`,
      '',
      'Récompenses:',
      `✨ XP: +${xp}`,
      `💰 Or: +${gold}`,
      `⚔️ Force: +${stat}`
    ];
    
    const statsText = this.add.text(0, -50, stats.join('\n'), {
      fontSize: '24px',
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5);
    
    // Boutons
    const continueBtn = this.add.rectangle(0, 180, 200, 50, 0x44ff44);
    continueBtn.setInteractive();
    continueBtn.setStrokeStyle(2, 0xffffff);
    
    const continueText = this.add.text(0, 180, 'Continuer', {
      fontSize: '24px',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    resultWindow.add([bg, title, statsText, continueBtn, continueText]);
    
    // Animation d'apparition
    resultWindow.setScale(0);
    this.tweens.add({
      targets: resultWindow,
      scale: 1,
      duration: 500,
      ease: 'Back.easeOut'
    });
    
    continueBtn.on('pointerdown', () => {
      // Sauvegarder les résultats
      if (this.playerData) {
        this.playerData.stats.strength += stat;
        this.playerData.gold += gold;
        this.playerData.xp += xp;
      }
      
      // Retourner au hub
      this.scene.start('TrainingSelectionScene', { playerData: this.playerData });
    });
  }

  update() {
    // Mise à jour continue si nécessaire
  }
}
