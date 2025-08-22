import Phaser from 'phaser';

export default class WaitingScene extends Phaser.Scene {
  constructor() {
    super('WaitingScene');
  }

  create() {
    const { width, height } = this.scale;
    
    // Black background
    this.cameras.main.setBackgroundColor('#1a1a1a');
    
    // Loading text
    const loadingText = this.add.text(width / 2, height / 2, 'Loading combat...', {
      fontSize: '32px',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    // Fade in/out animation
    this.tweens.add({
      targets: loadingText,
      alpha: 0.3,
      duration: 1000,
      yoyo: true,
      repeat: -1
    });
  }
}
