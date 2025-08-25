import Phaser from 'phaser';
import LaBruteClientEngine from '../engine/LaBruteClientEngine.js';
import LaBruteOfficialAdapter from '../engine/LaBruteOfficialAdapter.js';

// Version avec placeholders rectangulaires pour tester les mécaniques
export class FightScenePlaceholder extends Phaser.Scene {
  constructor() { 
    super({ key: 'FightPlaceholder' }); 
  }

  init(data) {
    // Reset all combat variables
    this.combatOver = false;
    this.animationInProgress = false;
    this.stopCombat = false;
    this.clientEngine = null;
    this.fighters = [];
    this.hpBars = [];
    this.fighterHP = [];
    this.maxHP = [];
    this.currentFightData = data;
    
    console.log('=== PLACEHOLDER SCENE INITIALIZED ===');
    
    // Save initial stats
    this.initialA = data?.a ? JSON.parse(JSON.stringify(data.a)) : null;
    this.initialB = data?.b ? JSON.parse(JSON.stringify(data.b)) : null;
    this.initialBackground = data?.background || null;
  }

  preload() {
    // Load backgrounds
    const backgrounds = [
      'bg-06_36_37.png',
      'bg-06_37_45.png', 
      'bg-06_39_52.png',
      'bg-06_40_09.png',
      'bg-06_42_47.png',
      'bg-06_42_53.png'
    ];
    
    backgrounds.forEach(bg => {
      const key = bg.replace('.png', '');
      this.load.image(key, `assets/backgrounds/${bg}`);
    });

    // Load shadows
    this.load.image('shadow', 'assets/misc/shadow.png');
  }

  create() {
    // Add background
    const bgKey = this.initialBackground || 'bg-06_36_37';
    const bg = this.add.image(512, 384, bgKey);
    bg.setScale(1.5).setDepth(-10);
    
    // Arena ground line
    this.add.line(512, 500, 100, 0, 924, 0, 0x00ff00, 0.3);
    
    // Distance markers
    for (let x = 100; x <= 900; x += 100) {
      this.add.text(x, 510, `${x}`, { fontSize: '8px', color: '#666666' }).setOrigin(0.5);
    }
    
    // Create placeholder fighters
    this.createPlaceholderFighter(0, 300, 450, 0xff4444, this.initialA);
    this.createPlaceholderFighter(1, 724, 450, 0x4444ff, this.initialB);
    
    // Initialize combat engine
    this.clientEngine = new LaBruteClientEngine(this);
    
    // If we have server data, start processing it
    if (this.currentFightData?.steps) {
      this.startServerCombat();
    }
    
    // Combat info text
    this.combatInfo = this.add.text(512, 50, 'PLACEHOLDER COMBAT TEST', {
      fontSize: '20px',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);
    
    // Add debug text
    this.debugText = this.add.text(10, 10, '', {
      fontSize: '12px',
      color: '#00ff00'
    });
  }

  createPlaceholderFighter(index, x, y, color, data) {
    const container = this.add.container(x, y);
    
    // Shadow
    const shadow = this.add.ellipse(0, 50, 80, 20, 0x000000, 0.5);
    
    // Body (rectangle representing fighter)
    const body = this.add.rectangle(0, 0, 50, 100, color);
    body.setStrokeStyle(2, 0xffffff);
    
    // Face (to show direction)
    const face = this.add.circle(index === 0 ? 15 : -15, -30, 5, 0xffffff);
    
    // Name label
    const name = data?.name || `Fighter ${index + 1}`;
    const nameText = this.add.text(0, -70, name, {
      fontSize: '14px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
    
    // State indicator
    const stateText = this.add.text(0, 60, 'idle', {
      fontSize: '10px',
      color: '#00ff00'
    }).setOrigin(0.5);
    
    // Weapon placeholder
    const weapon = this.add.rectangle(index === 0 ? 30 : -30, -10, 8, 40, 0xffff00);
    weapon.setVisible(false); // Hidden by default
    
    container.add([shadow, body, face, nameText, stateText, weapon]);
    
    // Store fighter data
    this.fighters[index] = {
      container: container,
      body: body,
      face: face,
      shadow: shadow,
      nameText: nameText,
      stateText: stateText,
      weapon: weapon,
      x: x,
      y: y,
      side: index === 0 ? 'left' : 'right',
      currentState: 'idle',
      isDead: false,
      data: data
    };
    
    // Initialize HP
    this.fighterHP[index] = data?.hp || 100;
    this.maxHP[index] = data?.hp || 100;
    
    // Create HP bar
    this.createHPBar(index, x, y - 120);
    
    return container;
  }

  createHPBar(fighterIndex, x, y) {
    const container = this.add.container(x, y);
    
    const width = 100;
    const height = 12;
    
    // Background
    const bgBar = this.add.rectangle(0, 0, width, height, 0x000000);
    bgBar.setStrokeStyle(2, 0x00ff00);
    
    // HP fill
    const fillBar = this.add.rectangle(0, 0, width - 4, height - 4, 0x00ff00);
    
    // HP text
    const hpText = this.add.text(0, -20, `${this.fighterHP[fighterIndex]}/${this.maxHP[fighterIndex]}`, {
      fontSize: '12px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
    
    container.add([bgBar, fillBar, hpText]);
    
    this.hpBars[fighterIndex] = {
      container: container,
      fillBar: fillBar,
      text: hpText,
      maxWidth: width - 4
    };
  }

  updateHPBar(fighterIndex) {
    const bar = this.hpBars[fighterIndex];
    if (!bar) return;
    
    const currentHP = Math.max(0, this.fighterHP[fighterIndex]);
    const maxHP = this.maxHP[fighterIndex];
    const hpPercent = currentHP / maxHP;
    
    // Update fill width
    const newWidth = bar.maxWidth * hpPercent;
    bar.fillBar.setSize(newWidth, bar.fillBar.height);
    bar.fillBar.x = -(bar.maxWidth - newWidth) / 2;
    
    // Update color
    let color = 0x00ff00;
    if (hpPercent < 0.3) color = 0xff0000;
    else if (hpPercent < 0.6) color = 0xffff00;
    bar.fillBar.setFillStyle(color);
    
    // Update text
    bar.text.setText(`${currentHP}/${maxHP}`);
    
    // Follow fighter
    const fighter = this.fighters[fighterIndex];
    if (fighter) {
      bar.container.x = fighter.container.x;
      bar.container.y = fighter.container.y - 120;
    }
  }

  // Animation methods for placeholders
  setPlaceholderState(fighter, state) {
    if (!fighter || fighter.isDead) return;
    
    fighter.currentState = state;
    fighter.stateText.setText(state);
    
    // Visual feedback based on state
    switch(state) {
      case 'idle':
        fighter.body.setFillStyle(fighter.side === 'left' ? 0xff4444 : 0x4444ff);
        fighter.weapon.setVisible(false);
        break;
        
      case 'walk':
      case 'run':
        fighter.body.setFillStyle(0xffff00);
        // Bounce effect
        this.tweens.add({
          targets: fighter.container,
          y: fighter.y - 5,
          duration: 200,
          yoyo: true,
          repeat: -1
        });
        break;
        
      case 'attack':
        fighter.body.setFillStyle(0xff0000);
        fighter.weapon.setVisible(true);
        // Weapon swing
        this.tweens.add({
          targets: fighter.weapon,
          angle: fighter.side === 'left' ? 45 : -45,
          duration: 200,
          yoyo: true
        });
        break;
        
      case 'hit':
        // Flash white
        fighter.body.setFillStyle(0xffffff);
        this.time.delayedCall(100, () => {
          fighter.body.setFillStyle(fighter.side === 'left' ? 0xff4444 : 0x4444ff);
        });
        break;
        
      case 'death':
        fighter.isDead = true;
        fighter.body.setFillStyle(0x666666);
        // Fall animation
        this.tweens.add({
          targets: fighter.container,
          angle: 90,
          y: fighter.y + 30,
          duration: 500
        });
        break;
    }
  }

  moveFighter(fighterIndex, targetX) {
    const fighter = this.fighters[fighterIndex];
    if (!fighter || fighter.isDead) return;
    
    const distance = Math.abs(targetX - fighter.container.x);
    const duration = (distance / 300) * 1000; // 300px/s
    
    this.setPlaceholderState(fighter, distance > 150 ? 'run' : 'walk');
    
    this.tweens.add({
      targets: fighter.container,
      x: targetX,
      duration: duration,
      ease: 'Linear',
      onComplete: () => {
        fighter.x = targetX;
        this.setPlaceholderState(fighter, 'idle');
        this.tweens.killTweensOf(fighter.container);
      }
    });
  }

  attackAnimation(attackerIndex, targetIndex, damage) {
    const attacker = this.fighters[attackerIndex];
    const target = this.fighters[targetIndex];
    if (!attacker || !target) return;
    
    this.setPlaceholderState(attacker, 'attack');
    
    this.time.delayedCall(200, () => {
      this.setPlaceholderState(target, 'hit');
      
      // DON'T recalculate HP - it's already updated from server
      // Just update the HP bar display
      this.updateHPBar(targetIndex);
      
      // Show damage text
      const damageText = this.add.text(
        target.container.x, 
        target.container.y - 50,
        `-${damage}`,
        { fontSize: '20px', color: '#ff0000', fontStyle: 'bold' }
      );
      
      this.tweens.add({
        targets: damageText,
        y: damageText.y - 30,
        alpha: 0,
        duration: 1000,
        onComplete: () => damageText.destroy()
      });
      
      // Check death
      if (this.fighterHP[targetIndex] <= 0) {
        this.setPlaceholderState(target, 'death');
      }
    });
    
    this.time.delayedCall(500, () => {
      if (!attacker.isDead) {
        this.setPlaceholderState(attacker, 'idle');
      }
    });
  }

  async startServerCombat() {
    if (!this.currentFightData?.steps) {
      console.log('No combat data available');
      return;
    }
    
    console.log('Starting server combat with', this.currentFightData.steps.length, 'steps');
    
    // Process steps
    for (const step of this.currentFightData.steps) {
      if (this.stopCombat) break;
      
      await this.processStep(step);
      await this.delay(200);
    }
  }

  async processStep(step) {
    // Update HP from server if provided (for synchronization)
    if (step.hp1 !== undefined && step.hp2 !== undefined) {
      this.fighterHP[0] = step.hp1;
      this.fighterHP[1] = step.hp2;
      this.updateHPBar(0);
      this.updateHPBar(1);
    }
    
    // Step types from server
    const StepType = {
      Arrive: 2,
      Hit: 9,
      Move: 15,
      Block: 20,
      Evade: 21,
      Death: 24,
      End: 26
    };
    
    switch(step.a) {
      case StepType.Arrive:
        console.log('Fighter arrives');
        break;
        
      case StepType.Move:
        if (step.f !== undefined && step.x !== undefined) {
          this.moveFighter(step.f, step.x);
          await this.delay(1000);
        }
        break;
        
      case StepType.Hit:
        if (step.f !== undefined && step.t !== undefined && step.d) {
          this.attackAnimation(step.f, step.t, step.d);
          await this.delay(600);
        }
        break;
        
      case StepType.Block:
        console.log('Block');
        break;
        
      case StepType.Evade:
        console.log('Evade');
        break;
        
      case StepType.Death:
        if (step.f !== undefined) {
          this.setPlaceholderState(this.fighters[step.f], 'death');
        }
        break;
        
      case StepType.End:
        console.log('Combat ended');
        this.combatOver = true;
        this.showWinner(step.w, step.l);
        break;
    }
    
    this.updateDebugInfo();
  }

  showWinner(winnerIndex, loserIndex) {
    const winner = this.fighters[winnerIndex];
    const loser = this.fighters[loserIndex];
    
    if (winner) {
      const winText = this.add.text(512, 300, `${winner.data?.name || 'Fighter'} WINS!`, {
        fontSize: '48px',
        color: '#ffff00',
        stroke: '#000000',
        strokeThickness: 4
      }).setOrigin(0.5);
      
      this.tweens.add({
        targets: winText,
        scale: 1.2,
        duration: 500,
        yoyo: true,
        repeat: -1
      });
    }
  }

  updateDebugInfo() {
    const distance = Math.abs(this.fighters[1].container.x - this.fighters[0].container.x);
    const info = [
      `Distance: ${Math.round(distance)}px`,
      `F1: HP=${this.fighterHP[0]}/${this.maxHP[0]} State=${this.fighters[0].currentState}`,
      `F2: HP=${this.fighterHP[1]}/${this.maxHP[1]} State=${this.fighters[1].currentState}`
    ];
    this.debugText.setText(info.join('\n'));
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}