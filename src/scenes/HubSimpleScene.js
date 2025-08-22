import Phaser from 'phaser';

export class HubSimpleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'HubSimpleScene' });
  }

  create() {
    // Fond simple
    this.cameras.main.setBackgroundColor('#87CEEB');
    
    // Titre
    this.add.text(512, 50, 'Hub Amélioré - Votre Domaine', {
      fontSize: '48px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5);
    
    // Sol
    this.add.rectangle(512, 650, 1024, 300, 0x3B7F3C);
    
    // Bâtiments simplifiés
    const buildings = [
      { name: 'Caserne', x: 200, y: 400, color: 0x8B4513 },
      { name: 'Entraînement', x: 400, y: 350, color: 0xFF6347 },
      { name: 'Forge', x: 600, y: 380, color: 0x696969 },
      { name: 'Arène', x: 800, y: 400, color: 0xFFD700 },
      { name: 'Marché', x: 500, y: 500, color: 0x32CD32 }
    ];
    
    buildings.forEach(b => {
      // Base du bâtiment
      const building = this.add.rectangle(b.x, b.y, 120, 100, b.color);
      building.setInteractive();
      building.setStrokeStyle(3, 0xffffff);
      
      // Toit
      const roof = this.add.triangle(b.x, b.y - 70, 60, 40, 0, 0, 120, 40, b.color * 0.8);
      
      // Nom
      const text = this.add.text(b.x, b.y + 70, b.name, {
        fontSize: '16px',
        color: '#ffffff',
        backgroundColor: '#000000',
        padding: { x: 5, y: 2 }
      }).setOrigin(0.5);
      
      // Animation simple
      building.on('pointerover', () => {
        building.setScale(1.1);
        roof.setScale(1.1);
      });
      
      building.on('pointerout', () => {
        building.setScale(1);
        roof.setScale(1);
      });
      
      building.on('pointerdown', () => {
        if (b.name === 'Entraînement') {
          this.scene.start('TrainingScene');
        } else if (b.name === 'Caserne') {
          window.location.href = '/my-shackers.html';
        } else {
          this.showMessage(`${b.name} - Bientôt disponible!`);
        }
      });
    });
    
    // Ressources
    this.add.text(512, 120, '💰 Or: 1000 | 🪵 Bois: 200 | 🪨 Pierre: 150 | ⭐ Gloire: 50', {
      fontSize: '24px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 }
    }).setOrigin(0.5);
    
    // Bouton retour
    const backBtn = this.add.rectangle(100, 50, 150, 40, 0x4444ff);
    backBtn.setInteractive();
    backBtn.setStrokeStyle(2, 0xffffff);
    
    this.add.text(100, 50, '← Menu', {
      fontSize: '20px',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    backBtn.on('pointerover', () => backBtn.setFillStyle(0x6666ff));
    backBtn.on('pointerout', () => backBtn.setFillStyle(0x4444ff));
    backBtn.on('pointerdown', () => window.location.href = '/home.html');
    
    // Animations d'ambiance
    this.createSimpleAnimations();
  }
  
  createSimpleAnimations() {
    // Nuages simples
    for (let i = 0; i < 3; i++) {
      const cloud = this.add.ellipse(
        -100,
        Phaser.Math.Between(50, 150),
        Phaser.Math.Between(80, 120),
        40,
        0xffffff,
        0.3
      );
      
      this.tweens.add({
        targets: cloud,
        x: 1124,
        duration: Phaser.Math.Between(20000, 40000),
        repeat: -1,
        delay: i * 5000
      });
    }
    
    // Feuilles qui tombent
    for (let i = 0; i < 5; i++) {
      const leaf = this.add.rectangle(
        Phaser.Math.Between(0, 1024),
        -20,
        10, 10,
        Phaser.Math.RND.pick([0x90EE90, 0x228B22, 0xFFFF00])
      );
      
      this.tweens.add({
        targets: leaf,
        y: 800,
        x: leaf.x + Phaser.Math.Between(-50, 50),
        angle: 360,
        duration: Phaser.Math.Between(10000, 15000),
        repeat: -1,
        delay: i * 2000,
        onRepeat: () => {
          leaf.x = Phaser.Math.Between(0, 1024);
          leaf.y = -20;
        }
      });
    }
  }
  
  showMessage(text) {
    const msg = this.add.text(512, 300, text, {
      fontSize: '32px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5);
    
    this.tweens.add({
      targets: msg,
      alpha: 0,
      y: 250,
      duration: 2000,
      onComplete: () => msg.destroy()
    });
  }
}
