import Phaser from 'phaser';
import { CombatEngine } from '../engine/CombatEngine.js';

// Combat scene powered by CombatEngine, rendering fighters with Spine
export class FightSceneSpine extends Phaser.Scene {
  constructor() { super({ key: 'FightSpine' }); }

  init(data) {
    // Expect data: { fighters, steps } from server OR legacy { a, b }
    this.serverFighters = data?.fighters || null;
    this.serverSteps = data?.steps || null;
    this.initialA = data?.a || null;
    this.initialB = data?.b || null;
  }

  preload() {
    this.load.spineJson('spineboy-data', 'assets/spine/spineboy-pro.json');
    this.load.spineAtlas('spineboy-atlas', 'assets/spine/spineboy.atlas');
    // Explicit background to avoid missing texture
    this.load.image('arena-bg', 'assets/images/sprites/background.png');
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    // Camera baseline uses full game size
    this.cameras.main.setZoom(1);
    this.cameras.main.setScroll(0, 0);
    this.cameras.main.roundPixels = true;
    this.cameras.main.setBounds(0, 0, W, H);

    // Background - fill canvas exactly and center
    const bg = this.add.image(W / 2, H / 2, 'arena-bg');
    bg.setOrigin(0.5, 0.5).setDisplaySize(W, H).setDepth(-10);

    // Combat zone scaled from original ratios (was 1024x768)
    this.combatZone = {
      minY: Math.round(H * (420 / 768)),
      maxY: Math.round(H * (580 / 768)),
      leftMinX: Math.round(W * (100 / 1024)),
      leftMaxX: Math.round(W * (300 / 1024)),
      rightMinX: Math.round(W * (724 / 1024)),
      rightMaxX: Math.round(W * (924 / 1024)),
      centerX: Math.round(W / 2)
    };

    const baseScale = 0.30;

    // Initial free positions
    const leftBaseX = Phaser.Math.Between(this.combatZone.leftMinX, this.combatZone.leftMaxX);
    const leftBaseY = Phaser.Math.Between(this.combatZone.minY, this.combatZone.maxY);
    const rightBaseX = Phaser.Math.Between(this.combatZone.rightMinX, this.combatZone.rightMaxX);
    const rightBaseY = Phaser.Math.Between(this.combatZone.minY, this.combatZone.maxY);

    // Create fighters
    const left = this.add.spine(leftBaseX, leftBaseY, 'spineboy-data', 'spineboy-atlas');
    const sL = baseScale * this.getFighterScale(leftBaseY);
    const right = this.add.spine(rightBaseX, rightBaseY, 'spineboy-data', 'spineboy-atlas');
    const sR = baseScale * this.getFighterScale(rightBaseY);

    const ref = Math.min(Math.abs(sL), Math.abs(sR));
    left.setScale(ref, ref);
    right.setScale(-ref, ref);

    // Shadows
    const shadowL = this.add.ellipse(leftBaseX, leftBaseY + this.getShadowOffset(leftBaseY), 100 * this.getShadowScale(leftBaseY), 25 * this.getShadowScale(leftBaseY), 0x000000, 0.35);
    const shadowR = this.add.ellipse(rightBaseX, rightBaseY + this.getShadowOffset(rightBaseY), 100 * this.getShadowScale(rightBaseY), 25 * this.getShadowScale(rightBaseY), 0x000000, 0.35);

    // Idle anims
    this.setSpineAnim(left, 'idle', true);
    this.setSpineAnim(right, 'idle', true);

    // Fighters for engine
    this.fighter1 = { sprite: left, shadow: shadowL, side: 'left', scene: this, baseX: leftBaseX, baseY: leftBaseY, baseScale };
    this.fighter2 = { sprite: right, shadow: shadowR, side: 'right', scene: this, baseX: rightBaseX, baseY: rightBaseY, baseScale };

    // Stats
    const statsA = this.serverFighters ? { name: this.serverFighters[0].name, health: this.serverFighters[0].maxHp ?? this.serverFighters[0].hp, maxHealth: this.serverFighters[0].maxHp ?? this.serverFighters[0].hp, stamina:100, maxStamina:100, strength: this.serverFighters[0].strength, defense:0, agility:this.serverFighters[0].agility, speed:this.serverFighters[0].speed, initiative:0, baseInitiative:1, counter:0, combo:0 }
      : (this.initialA || { name: 'Brute Alpha', health: 100, maxHealth: 100, stamina: 100, maxStamina: 100, strength: 20, defense: 10, agility: 15, speed: 12, initiative: 0, baseInitiative: 1, counter: 0, combo: 0 });
    const statsB = this.serverFighters ? { name: this.serverFighters[1].name, health: this.serverFighters[1].maxHp ?? this.serverFighters[1].hp, maxHealth: this.serverFighters[1].maxHp ?? this.serverFighters[1].hp, stamina:100, maxStamina:100, strength: this.serverFighters[1].strength, defense:0, agility:this.serverFighters[1].agility, speed:this.serverFighters[1].speed, initiative:0, baseInitiative:1, counter:0, combo:0 }
      : (this.initialB || { name: 'Brute Beta',  health: 100, maxHealth: 100, stamina: 100, maxStamina: 100, strength: 20, defense: 10, agility: 15, speed: 12, initiative: 0, baseInitiative: 1, counter: 0, combo: 0 });
    this.fighter1.stats = statsA;
    this.fighter2.stats = statsB;

    this.updateDepthOrdering();

    // UI adapted to width
    this.ui = this.createSimpleUI(W, H);
    this.appendLog('Combat prêt.');

    // Require server steps. No local fallback to avoid desync/confusion.
    if (this.serverSteps && Array.isArray(this.serverSteps)) {
      this.replaySteps(this.serverSteps);
    } else {
      this.appendLog('Aucun steps serveur. Lance un combat via "Mes brutes".');
      const { width, height } = this.scale;
      this.add.text(width/2, height/2, 'Lance un combat via "Mes brutes"', {
        fontSize: '22px', color: '#ffcc00', stroke: '#000', strokeThickness: 4
      }).setOrigin(0.5);
      // Option: retour automatique après un court délai
      this.time.delayedCall(1200, () => this.scene.start('MyBrutesScene'));
      return;
    }
  }

  async replaySteps(steps) {
    const wait = (ms)=> new Promise(r=>this.time.delayedCall(ms, r));
    for (let i=0;i<steps.length;i++) {
      const s = steps[i];
      switch (s.a) {
        case 2: /* Arrive */ break;
        case 15: /* Move */ {
          const a = s.f === 0 ? this.fighter1 : this.fighter2;
          const t = s.t === 0 ? this.fighter1 : this.fighter2;
          const gap = this.getContactGap(a, t, 12 + ((a.stats && a.stats.reach ? a.stats.reach*8 : 0)));
          const targetX = t.sprite.x + (a.side === 'left' ? -gap : gap);
          const targetY = Phaser.Math.Clamp(t.sprite.y, this.combatZone.minY, this.combatZone.maxY);
          const dist = Math.abs(targetX - a.sprite.x);
          // Si déjà à portée, ne pas bouger (évite ping-pong)
          if (dist <= 2) break;
          const duration = Math.max(90, (dist / 650) * 1000);
          this.playRun(a);
          await this.moveFighterTo(a, targetX, targetY, duration, 'Linear');
          break;
        }
        case 19: /* AttemptHit */ {
          const a = s.f === 0 ? this.fighter1 : this.fighter2;
          this.playAttack(a);
          await wait(100);
          break;
        }
        case 21: /* Evade */ {
          const t = s.f === 0 ? this.fighter1 : this.fighter2;
          this.playDodge(t);
          await wait(100);
          break;
        }
        case 20: /* Block */ {
          const t = s.f === 0 ? this.fighter1 : this.fighter2;
          this.showBlockIndicator(t);
          await wait(100);
          break;
        }
        case 27: /* Counter */ {
          // Visual hint; actual damage will come as a Hit step right after
          const c = s.f === 0 ? this.fighter1 : this.fighter2;
          this.playAttack(c);
          await wait(120);
          break;
        }
        case 9: /* Hit */ {
          const a = s.f === 0 ? this.fighter1 : this.fighter2;
          const t = s.t === 0 ? this.fighter1 : this.fighter2;
          this.shakeMedium();
          this.showDamageNumber(t, s.d, !!s.c);
          t.stats.health = Math.max(0, t.stats.health - (s.d||0));
          this.updateUI();
          await wait(100);
          break;
        }
        case 17: /* MoveBack */ {
          const a = s.f === 0 ? this.fighter1 : this.fighter2;
          const dist = Math.abs(a.baseX - a.sprite.x);
          const duration = Math.max(80, (dist / 700) * 1000);
          await this.moveFighterTo(a, a.baseX, a.baseY, duration, 'Linear');
          this.playIdle(a);
          break;
        }
        case 24: /* Death */ {
          const d = s.f === 0 ? this.fighter1 : this.fighter2;
          d.stats.health = 0; this.updateUI();
          d.sprite.alpha = 0.2; await wait(100);
          break;
        }
        case 26: /* End */ {
          const winner = s.w === 0 ? this.fighter1 : this.fighter2;
          this.appendLog(`Vainqueur: ${winner.stats.name}`);
          return; // stop replay after End
        }
      }
      await wait(30);
    }
  }

  setSpineAnim(spineObj, name, loop=false) {
    try { spineObj.animationState.setAnimation(0, name, loop); } catch(e) {}
  }

  // Anim helpers
  playIdle(f) { this.setSpineAnim(f.sprite, 'idle', true); }
  playRun(f) { this.setSpineAnim(f.sprite, 'walk', true); }
  playAttack(f) { this.setSpineAnim(f.sprite, 'walk', false); this.time.delayedCall(180, () => this.playIdle(f)); }
  playDodge(f) {
    const dir = f.side === 'left' ? -140 : 140;
    this.playRun(f);
    this.tweens.add({ targets: f.sprite, x: f.sprite.x + dir, yoyo: true, duration: 150, ease: 'Power2', onComplete:()=>this.playIdle(f)});
    this.tweens.add({ targets: f.shadow, x: f.shadow.x + dir, yoyo: true, duration: 150, ease: 'Power2' });
  }
  playBlock(f) { this.tweens.add({ targets: f.sprite, scaleY: Math.abs(f.sprite.scaleY)*0.9, duration: 80, yoyo: true, ease: 'Sine.easeInOut' }); }
  playEvadeTick(f) {
    const dir = f.side === 'left' ? -16 : 16;
    this.tweens.add({ targets: f.sprite, x: f.sprite.x + dir, duration: 70, yoyo: true, ease: 'Power2' });
    if (f.shadow) this.tweens.add({ targets: f.shadow, x: f.shadow.x + dir, duration: 70, yoyo: true, ease: 'Power2' });
  }

  // FX helpers
  shakeLight() { this.cameras.main.shake(70, 0.0035); }
  shakeMedium() { this.cameras.main.shake(110, 0.007); }
  shakeTarget(target) { this.tweens.add({ targets: target.sprite, x: target.sprite.x + (target.side==='left'? -10:10), duration: 34, yoyo: true, repeat: 1 }); }
  flashSpine(spineObj, color={r:1,g:0.6,b:0.6,a:1}, duration=100) {
    try { const o = { ...spineObj.skeleton.color }; spineObj.skeleton.color.set(color.r,color.g,color.b,color.a); this.time.delayedCall(duration,()=>spineObj.skeleton.color.set(o.r,o.g,o.b,o.a)); }
    catch(_) { const g=this.add.graphics(); g.fillStyle(0xffffff,0.25); g.fillRect(spineObj.x-60, spineObj.y-140, 120, 160); this.tweens.add({ targets:g, alpha:0, duration, onComplete:()=>g.destroy() }); }
  }
  async hitStop(slow=0.35, ms=80) {
    const prevTime = this.time.timeScale; const prevTween = this.tweens.timeScale;
    this.time.timeScale = slow; this.tweens.timeScale = slow;
    const fighters = [this.fighter1, this.fighter2].filter(Boolean);
    const prevAnim = fighters.map(f => f.sprite?.animationState?.timeScale ?? 1);
    fighters.forEach(f => { if (f.sprite?.animationState) f.sprite.animationState.timeScale = slow; });
    await new Promise(res => this.time.delayedCall(ms, res));
    this.time.timeScale = prevTime; this.tweens.timeScale = prevTween;
    fighters.forEach((f,i) => { if (f.sprite?.animationState) f.sprite.animationState.timeScale = prevAnim[i] ?? 1; });
  }
  showTextIndicator(target, text, color='#ffffff') {
    const t = this.add.text(target.sprite.x, target.sprite.y - 128, text, { fontSize: '36px', color, stroke:'#000', strokeThickness:7 }).setOrigin(0.5).setDepth(2000);
    this.tweens.add({ targets: t, y: t.y - 48, alpha: 0, duration: 620, ease: 'Power2', onComplete:()=>t.destroy() });
  }
  showMissEffect(target) { this.showTextIndicator(target, 'MISS', '#cfcfcf'); }
  createDodgeIndicator(target) { this.showTextIndicator(target, 'DODGE', '#4ec3ff'); }
  showBlockIndicator(target) { this.showTextIndicator(target, 'BLOCK', '#ffd54a'); this.shakeLight(); }

  sleep(ms) { return new Promise(res => this.time.delayedCall(ms, res)); }
  killFighterTweens(f) { this.tweens.killTweensOf(f.sprite); if (f.shadow) this.tweens.killTweensOf(f.shadow); }
  moveFighterTo(f, x, y, duration, ease='Linear') {
    this.killFighterTweens(f);
    const p1 = new Promise(res => this.tweens.add({ targets: f.sprite, x, y, duration, ease, onComplete: res }));
    const sScale = this.getShadowScale(y);
    const p2 = f.shadow ? new Promise(res => this.tweens.add({ targets: f.shadow, x, y: y + this.getShadowOffset(y), scaleX: sScale, scaleY: sScale, duration, ease, onComplete: res })) : Promise.resolve();
    return Promise.all([p1, p2]);
  }
  estimateHalfWidth(f) {
    const sx = Math.abs(f.sprite.scaleX || 1);
    return Math.max(24, 100 * sx);
  }
  getContactGap(attacker, target, margin=12) {
    const halfA = this.estimateHalfWidth(attacker);
    const halfT = this.estimateHalfWidth(target);
    return halfA + halfT + margin;
  }

  async executeTurn() {
    if (this.combatOver) return;
    if (this.turnInProgress) return;
    this.turnInProgress = true;

    let result;
    try {
      result = this.engine.executeTurn();
    } catch (e) {
      console.error('Combat error:', e);
      this.turnInProgress = false;
      await this.sleep(120);
      return this.executeTurn();
    }

    if (!result) { this.turnInProgress = false; await this.sleep(140); return this.executeTurn(); }

    const attacker = result.attacker; const target = result.target;

    if (result.type === 'attack' || result.type === 'multi_attack' || result.type === 'counter') {
      this.appendLog(`${attacker.stats.name} attaque ${target.stats.name}${result.type==='multi_attack'?' (combo)':''}${result.critical?' [CRIT]':''}${result.hit?` et inflige ${result.damage}`:" mais rate"}`);

      const contactGap = this.getContactGap(attacker, target, 14);
      const contactYOffset = attacker.side === 'left' ? 8 : -8;
      const contactY = Phaser.Math.Clamp(target.sprite.y + contactYOffset, this.combatZone.minY, this.combatZone.maxY);
      const attackX = target.sprite.x + (attacker.side === 'left' ? -contactGap : contactGap);
      const distance = Math.abs(attackX - attacker.sprite.x);
      const runDuration = Phaser.Math.Clamp(distance * 0.52, 75, 230);

      this.playRun(attacker);
      await this.moveFighterTo(attacker, attackX, contactY, runDuration, 'Linear');

      if (result.hit && result.damage > 0) {
        await this.hitStop(0.3, 70);
        this.flashSpine(target.sprite);
        this.updateUI();
        try {
          const old = { ...target.sprite.skeleton.color };
          target.sprite.skeleton.color.set(1,0.4,0.4,1);
          this.time.delayedCall(120,()=> target.sprite.skeleton.color.set(old.r,old.g,old.b,old.a));
        } catch(_) {}

        this.shakeTarget(target);
        this.shakeMedium();
        const g2 = this.add.graphics();
        g2.fillStyle(0xff2a2a, 0.45);
        g2.fillCircle(target.sprite.x + (target.side==='left'?-5:5), target.sprite.y - 46, 6);
        this.tweens.add({targets:g2, alpha:0, scale:2.2, duration:320, onComplete:()=>g2.destroy()});

        this.showDamageNumber(target, result.damage, !!result.critical);
      } else if (result.type !== 'dodge') {
        this.showMissEffect(target);
        this.playEvadeTick(target);
      }

      this.playAttack(attacker);
      await this.sleep(60);
      await this.returnToPosition(attacker);

    } else if (result.type === 'block') {
      this.appendLog(`${target.stats.name} bloque l'attaque de ${attacker.stats.name}`);
      this.playBlock(target);
      this.showBlockIndicator(target);
      await this.sleep(120);
    } else if (result.type === 'dodge') {
      this.appendLog(`${target.stats.name} esquive l'attaque de ${attacker.stats.name}`);
      this.playDodge(target);
      this.createDodgeIndicator(target);
      await this.sleep(150);
    } else if (result.type === 'throw') {
      this.appendLog(`${attacker.stats.name} lance une arme sur ${target.stats.name}${result.hit?` et inflige ${result.damage}`:" mais rate"}`);
      if (result.hit && result.damage>0) { this.flashSpine(target.sprite); this.shakeMedium(); this.showDamageNumber(target, result.damage, !!result.critical); }
      else { this.showMissEffect(target); }
      await this.sleep(120);
    } else if (result.type === 'special') {
      this.appendLog(`${attacker.stats.name} utilise une capacité spéciale !`);
      this.cameras.main.shake(130, 0.004);
      await this.sleep(140);
    }

    this.updateUI();
    if (result.gameOver) {
      this.combatOver = true;
      this.add.text(this.scale.width/2, 120, `${result.winner.stats.name} wins!`, { fontSize: '28px', color: '#fff' }).setOrigin(0.5);
      return;
    }

    this.turnInProgress = false;
    await this.sleep(160);
    return this.executeTurn();
  }

  showDodgeChanceIndicator(defender, dodgeChance, dodgeAttempted, dodgeSuccess) {}
  showBlockChanceIndicator(defender, blockChance, blockAttempted, blockSuccess, hasStamina) {}

  getFighterScale(y) { const n = (y - this.combatZone.minY) / (this.combatZone.maxY - this.combatZone.minY); return 0.8 + (n * 0.4); }
  getShadowScale(y) { const n = (y - this.combatZone.minY) / (this.combatZone.maxY - this.combatZone.minY); return 0.8 + (n * 0.8); }
  getShadowOffset(y) { return 5; }
  updateDepthOrdering() {
    const fighters = [this.fighter1, this.fighter2].filter(Boolean);
    fighters.sort((a,b)=>a.sprite.y-b.sprite.y);
    const base = 100; fighters.forEach((f,i)=>{ f.sprite.setDepth(base+i*10); if (f.shadow) f.shadow.setDepth(base-10); });
  }

  async returnToPosition(fighter) {
    const shouldChange = Math.random() < 0.4;
    let targetX = fighter.baseX;
    let targetY = fighter.baseY;
    if (shouldChange) {
      const minX = fighter.side === 'left' ? this.combatZone.leftMinX : this.combatZone.rightMinX;
      const maxX = fighter.side === 'left' ? this.combatZone.leftMaxX : this.combatZone.rightMaxX;
      targetX = Phaser.Math.Between(minX, maxX);
      targetY = Phaser.Math.Between(this.combatZone.minY, this.combatZone.maxY);
      fighter.baseX = targetX; fighter.baseY = targetY;
    }
    const dist = Math.abs(targetX - fighter.sprite.x);
    const duration = Math.max(120, (dist / 800) * 1000);
    await this.moveFighterTo(fighter, targetX, targetY, duration, 'Power2');
    this.playIdle(fighter);
    this.updateDepthOrdering();
  }

  // UI that adapts to canvas width
  createSimpleUI(W, H) {
    const margin = Math.round(W * 0.0625); // ~80 when W=1280
    const barWidth = Math.round(W * 0.28); // ~358 when W=1280
    const barHeight = 26;
    const f1bg = this.add.rectangle(margin, 40, barWidth, barHeight, 0x222222).setOrigin(0,0.5);
    const f1 = this.add.rectangle(margin, 40, barWidth, barHeight, 0x00e676).setOrigin(0,0.5).setStrokeStyle(2, 0x000000, 0.8);
    const f2bg = this.add.rectangle(W - margin, 40, barWidth, barHeight, 0x222222).setOrigin(1,0.5);
    const f2 = this.add.rectangle(W - margin, 40, barWidth, barHeight, 0xff5252).setOrigin(1,0.5).setStrokeStyle(2, 0x000000, 0.8);
    const f1t = this.add.text(margin, 16, this.fighter1.stats.name, { fontSize:'16px', color:'#fff' }).setOrigin(0,0.5);
    const f2t = this.add.text(W - margin, 16, this.fighter2.stats.name, { fontSize:'16px', color:'#fff' }).setOrigin(1,0.5);
    this.logBox = this.add.rectangle(W/2, H - 20, W - margin*0.8, 44, 0x000000, 0.35).setStrokeStyle(2, 0xffffff, 0.2);
    this.logText = this.add.text(margin * 0.6, H - 36, '', { fontSize:'16px', color:'#fff' });
    return { f1, f2, f1bg, f2bg, f1t, f2t, w: barWidth };
  }
  appendLog(line) { if (this.logText) this.logText.setText(line); }

  updateUI() {
    const p1 = this.fighter1.stats.health / this.fighter1.stats.maxHealth;
    const p2 = this.fighter2.stats.health / this.fighter2.stats.maxHealth;
    const s1 = Math.max(0, Math.min(1, p1));
    const s2 = Math.max(0, Math.min(1, p2));
    this.ui.f1.setScale(s1, 1);
    this.ui.f2.setScale(s2, 1);
  }

  showDamageNumber(target, amount, critical=false) {
    const t = this.add.text(target.sprite.x, target.sprite.y - 80, `${amount}`, { fontSize: critical ? '28px' : '22px', color: critical ? '#ffcc00' : '#ffffff', stroke:'#000', strokeThickness:3 }).setOrigin(0.5).setDepth(2000);
    this.tweens.add({ targets: t, y: t.y - 40, alpha: 0, duration: 600, ease: 'Power2', onComplete: () => t.destroy() });
  }
}




