import Phaser from 'phaser';
import { CombatEngine } from '../engine/CombatEngine.js';
import { setupRematchButton, saveInitialStats } from './RematchFix.js';

// Combat scene powered by CombatEngine, rendering fighters with Spine
export class FightSceneSpine extends Phaser.Scene {
  constructor() { super({ key: 'FightSpine' }); }

  init(data) {
    // Expect data: { a: {name, ...stats}, b: {name, ...stats} }
    // Sauvegarder les stats initiales pour le rematch
    if (data?.a && data?.b) {
      saveInitialStats(this, data.a, data.b);
    }
    // Faire des copies PROFONDES pour préserver les stats originales
    this.initialA = data?.a ? JSON.parse(JSON.stringify(data.a)) : null;
    this.initialB = data?.b ? JSON.parse(JSON.stringify(data.b)) : null;
    this.initialBackground = data?.background || null;
  }

  preload() {
    // Charger tous les personnages Spine disponibles
    this.load.spineJson('spineboy-data', 'assets/spine/spineboy-pro.json');
    this.load.spineAtlas('spineboy-atlas', 'assets/spine/spineboy.atlas');
    
    this.load.spineJson('raptor-data', 'assets/spine/raptor-pro.json');
    this.load.spineAtlas('raptor-atlas', 'assets/spine/raptor.atlas');
    
    // Charger tous les backgrounds disponibles
    const backgrounds = [
      'bg-06_36_37.png',
      'bg-06_37_45.png', 
      'bg-06_39_52.png',
      'bg-06_40_09.png',
      'bg-06_42_47.png',
      'bg-06_42_53.png'
    ];
    
    // Charger chaque background
    backgrounds.forEach((bg, index) => {
      this.load.image(`arena-bg-${index}`, `assets/images/backgrounds/${bg}`);
    });
    
    // Charger le GIF animé comme image statique (on l'animera manuellement)
    // Index 6 pour le GIF
    this.load.image('arena-bg-6', 'assets/images/backgrounds/veo30generatepreview_anime_le_decor__0.gif');
    
    // Fallback background
    this.load.image('arena-bg', 'assets/images/sprites/background.png');
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;
    
    // Show combat controls
    if (window.showCombatControls) {
      window.showCombatControls();
    }

    // Camera baseline uses full game size
    this.cameras.main.setZoom(1);
    this.cameras.main.setScroll(0, 0);
    this.cameras.main.roundPixels = true;
    this.cameras.main.setBounds(0, 0, W, H);

    // Sélection aléatoire du background (comme dans LaBrute officiel)
    const bgCount = 7; // 6 PNG + 1 GIF
    const randomBgIndex = Math.floor(Math.random() * bgCount);
    let bgKey = `arena-bg-${randomBgIndex}`;
    const isAnimatedBg = (randomBgIndex === 6); // Le GIF est à l'index 6
    
    // Vérifier si la texture existe, sinon utiliser le fallback
    if (!this.textures.exists(bgKey)) {
      console.warn(`Background ${bgKey} not found, using fallback`);
      bgKey = 'arena-bg'; // Fallback
    }
    
    // Background - agrandi pour couvrir tout l'écran et positionné plus haut (mais pas trop)
    const bg = this.add.image(W / 2, H * 0.40, bgKey); // Levé à 40% au lieu de 45%
    bg.setOrigin(0.5, 0.5).setDisplaySize(W * 1.4, H * 1.4).setDepth(-10); // Taille ajustée pour ne pas sortir
    
    // Si même le fallback n'existe pas, créer un fond coloré
    if (!this.textures.exists(bgKey)) {
      bg.setVisible(false);
      const bgRect = this.add.rectangle(W / 2, H / 2, W, H, 0x87CEEB); // Bleu ciel
      bgRect.setDepth(-10);
    }
    
    // Si c'est le background animé, créer des effets visuels simples
    if (isAnimatedBg) {
      console.log('Creating animated background effects');
      
      // Pas de mouvement du background (c'était distrayant)
      
      // Créer plusieurs couches avec des effets différents
      // Couche de brume/nuages qui bougent
      const mistLayer = this.add.rectangle(W/2, H/2, W * 1.5, H * 1.5, 0xFFFFFF);
      mistLayer.setAlpha(0.08).setDepth(-9);
      mistLayer.setBlendMode(Phaser.BlendModes.ADD);
      
      this.tweens.add({
        targets: mistLayer,
        x: mistLayer.x - 100,
        alpha: { from: 0.08, to: 0.15 },
        duration: 8000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      
      // Effet de lumière dynamique
      const lightGradient = this.add.rectangle(W/2, H * 0.3, W, H * 0.8, 0xFFE4B5);
      lightGradient.setAlpha(0.1).setDepth(-8);
      lightGradient.setBlendMode(Phaser.BlendModes.SCREEN);
      
      this.tweens.add({
        targets: lightGradient,
        alpha: { from: 0.05, to: 0.15 },
        y: lightGradient.y + 50,
        duration: 6000,
        yoyo: true,
        repeat: -1,
        ease: 'Quad.easeInOut'
      });
      
      // Petits éléments flottants (simulation de particules sans le système de particules)
      for (let i = 0; i < 8; i++) {
        const floatingElement = this.add.circle(
          Phaser.Math.Between(0, W),
          Phaser.Math.Between(-50, H),
          Phaser.Math.Between(2, 5),
          0xFFFFFF
        );
        floatingElement.setAlpha(0.3).setDepth(-7);
        
        // Animation aléatoire pour chaque élément
        this.tweens.add({
          targets: floatingElement,
          y: H + 100,
          x: floatingElement.x + Phaser.Math.Between(-50, 50),
          alpha: { from: 0.3, to: 0 },
          duration: Phaser.Math.Between(10000, 20000),
          repeat: -1,
          delay: i * 1500,
          ease: 'Linear'
        });
      }
    }
    
    // Système jour/nuit comme dans LaBrute officiel
    const timeOfDay = Math.random();
    if (timeOfDay < 0.2) {
      // Matin (20% de chance)
      bg.setTint(0xFFE4B5); // Teinte dorée
    } else if (timeOfDay < 0.7) {
      // Jour (50% de chance)
      bg.setTint(0xFFFFFF); // Normal
    } else if (timeOfDay < 0.9) {
      // Soir (20% de chance)
      bg.setTint(0xFFA066); // Teinte orange/coucher de soleil
    } else {
      // Nuit (10% de chance)
      bg.setTint(0x8888CC); // Teinte bleutée sombre
    }

    // Combat zone scaled from original ratios (was 1024x768) - positionnée plus bas
    this.combatZone = {
      minY: Math.round(H * (480 / 768)), // Plus bas dans l'écran
      maxY: Math.round(H * (640 / 768)), // Plus bas dans l'écran
      leftMinX: Math.round(W * (100 / 1024)),
      leftMaxX: Math.round(W * (300 / 1024)),
      rightMinX: Math.round(W * (724 / 1024)),
      rightMaxX: Math.round(W * (924 / 1024)),
      centerX: Math.round(W / 2)
    };

    const baseScale = 0.28; // Taille de base standard

    // Initial free positions
    const leftBaseX = Phaser.Math.Between(this.combatZone.leftMinX, this.combatZone.leftMaxX);
    const leftBaseY = Phaser.Math.Between(this.combatZone.minY, this.combatZone.maxY);
    const rightBaseX = Phaser.Math.Between(this.combatZone.rightMinX, this.combatZone.rightMaxX);
    const rightBaseY = Phaser.Math.Between(this.combatZone.minY, this.combatZone.maxY);

    // Sélection des personnages basée sur les données ou aléatoire
    const availableCharacters = [
      { data: 'spineboy-data', atlas: 'spineboy-atlas', scale: 1.0, type: 'spineboy' },
      { data: 'raptor-data', atlas: 'raptor-atlas', scale: 0.9, type: 'raptor' } // Un peu plus petit pour équilibrer visuellement
    ];
    
    // Utiliser le type de personnage depuis les données si disponible
    const leftCharType = this.initialA?.characterType || (Math.random() < 0.5 ? 'spineboy' : 'raptor');
    const rightCharType = this.initialB?.characterType || (Math.random() < 0.5 ? 'spineboy' : 'raptor');
    
    const leftChar = availableCharacters.find(c => c.type === leftCharType) || availableCharacters[0];
    const rightChar = availableCharacters.find(c => c.type === rightCharType) || availableCharacters[0];

    // Create fighters with random characters
    const left = this.add.spine(leftBaseX, leftBaseY, leftChar.data, leftChar.atlas);
    const sL = baseScale * leftChar.scale * this.getFighterScale(leftBaseY);
    const right = this.add.spine(rightBaseX, rightBaseY, rightChar.data, rightChar.atlas);
    const sR = baseScale * rightChar.scale * this.getFighterScale(rightBaseY);

    // Définir l'échelle IMMÉDIATEMENT pour éviter le changement de taille
    left.setScale(sL, sL);
    right.setScale(-sR, sR); // Négatif pour faire face à gauche
    
    // Stocker l'échelle de base SANS l'effet de profondeur pour uniformité
    left.baseScale = baseScale * leftChar.scale;
    right.baseScale = baseScale * rightChar.scale;

    // Shadows - Taille de base uniforme pour tous, position centrée
    const baseShadowWidth = 120; // Un peu plus large horizontalement
    const baseShadowHeight = 40; // Plus épais pour être bien visible
    // Décalage selon le côté et le type de personnage (inversé)
    const leftShadowXOffset = leftCharType === 'raptor' ? 10 : 2; // Vers la droite pour le perso de gauche
    const rightShadowXOffset = rightCharType === 'raptor' ? -10 : -2; // Vers la gauche pour le perso de droite
    
    // Adapter la taille de l'ombre selon le type de personnage
    const leftShadowScale = leftCharType === 'raptor' ? 1.6 : 1.0; // Beaucoup plus grande pour le raptor
    const rightShadowScale = rightCharType === 'raptor' ? 1.6 : 1.0; // Beaucoup plus grande pour le raptor
    
    const shadowL = this.add.ellipse(
      leftBaseX + leftShadowXOffset, 
      leftBaseY + this.getShadowOffset(leftBaseY), 
      baseShadowWidth * leftShadowScale, 
      baseShadowHeight * leftShadowScale, 
      0x000000, 
      0.35
    );
    const shadowR = this.add.ellipse(
      rightBaseX + rightShadowXOffset, 
      rightBaseY + this.getShadowOffset(rightBaseY), 
      baseShadowWidth * rightShadowScale, 
      baseShadowHeight * rightShadowScale, 
      0x000000, 
      0.35
    );

    // Idle anims - forcer le démarrage pour les raptors
    this.setSpineAnim(left, 'idle', true);
    this.setSpineAnim(right, 'idle', true);
    
    // Forcer explicitement l'animation walk pour les raptors au début
    if (leftCharType === 'raptor') {
      left.animationState.setAnimation(0, 'walk', true);
    }
    if (rightCharType === 'raptor') {
      right.animationState.setAnimation(0, 'walk', true);
    }

    // Fighters for engine - inclure le type de personnage
    this.fighter1 = { 
      sprite: left, 
      shadow: shadowL, 
      side: 'left', 
      scene: this, 
      baseX: leftBaseX, 
      baseY: leftBaseY, 
      baseScale,
      characterType: leftChar.data.includes('raptor') ? 'raptor' : 'spineboy'
    };
    this.fighter2 = { 
      sprite: right, 
      shadow: shadowR, 
      side: 'right', 
      scene: this, 
      baseX: rightBaseX, 
      baseY: rightBaseY, 
      baseScale,
      characterType: rightChar.data.includes('raptor') ? 'raptor' : 'spineboy'
    };

    // Stats - Create copies to avoid modifying originals
    // Valeurs par défaut équilibrées selon LaBrute officiel
    // Formule LaBrute: HP = 50 + (endurance × 6)
    const statsA = this.initialA ? {...this.initialA} : { 
      name: 'Brute Alpha', 
      health: 140, maxHealth: 140,  // 50 + (15 endurance × 6)
      stamina: 100, maxStamina: 100, 
      strength: 20,  // Augmenté pour des dégâts plus visibles
      defense: 3, 
      agility: 5, 
      speed: 5, 
      endurance: 15,  // Endurance pour avoir 140 HP
      initiative: 0, 
      baseInitiative: 1, 
      counter: 2, 
      combo: 1,
      level: 5  // Niveau plus élevé
    };
    const statsB = this.initialB ? {...this.initialB} : { 
      name: 'Brute Beta',  
      health: 140, maxHealth: 140,  // 50 + (15 endurance × 6)
      stamina: 100, maxStamina: 100, 
      strength: 20,  // Augmenté pour des dégâts plus visibles
      defense: 3, 
      agility: 5, 
      speed: 5, 
      endurance: 15,  // Endurance pour avoir 140 HP
      initiative: 0, 
      baseInitiative: 1, 
      counter: 2, 
      combo: 1,
      level: 5  // Niveau plus élevé
    };
    
    // Store clean copies of initial stats for rematch - SEULEMENT si pas déjà défini
    if (!this.initialA) {
      this.initialA = JSON.parse(JSON.stringify(statsA));
    }
    if (!this.initialB) {
      this.initialB = JSON.parse(JSON.stringify(statsB));
    }
    
    this.fighter1.stats = statsA;
    this.fighter2.stats = statsB;

    this.updateDepthOrdering();

    // UI adapted to width
    this.ui = this.createSimpleUI(W, H);
    this.appendLog('Combat prêt.');
    
    // Initialiser les barres de vie au maximum
    console.log(`Combat Start - ${this.fighter1.stats.name}: ${this.fighter1.stats.health}/${this.fighter1.stats.maxHealth} HP`);
    console.log(`Combat Start - ${this.fighter2.stats.name}: ${this.fighter2.stats.health}/${this.fighter2.stats.maxHealth} HP`);
    this.updateUI();

    // Attribution ALÉATOIRE des armes et pets (beaucoup combattent à mains nues dans LaBrute!)
    // Utiliser les armes officielles LaBrute avec 50% de chance d'avoir une arme
    const labruteWeapons = ['knife', 'broadsword', 'lance', 'fan', 'sai', 'shuriken', 
                           'axe', 'bumps', 'flail', 'mammothBone', 'halberd', 'whip'];
    const weapons = [...labruteWeapons, null, null]; // 50% chance d'avoir une arme
    const pets = [null, null, null, null, null, null, null, null, 'dog']; // Très rare d'avoir un pet au début
    
    // Armes aléatoires
    this.fighter1.weapon = weapons[Math.floor(Math.random() * weapons.length)];
    this.fighter2.weapon = weapons[Math.floor(Math.random() * weapons.length)];
    
    // Pets aléatoires
    this.fighter1.pet = pets[Math.floor(Math.random() * pets.length)];
    this.fighter2.pet = pets[Math.floor(Math.random() * pets.length)];
    
    // Transmettre les armes au moteur
    this.fighter1.stats.weapons = this.fighter1.weapon ? [this.fighter1.weapon] : [];
    this.fighter2.stats.weapons = this.fighter2.weapon ? [this.fighter2.weapon] : [];
    
    // Transmettre les pets au moteur
    this.fighter1.stats.pet = this.fighter1.pet;
    this.fighter2.stats.pet = this.fighter2.pet;
    
    // Créer les sprites d'armes (simplifiés pour l'instant)
    this.createWeaponSprites();
    
    // Ajouter les propriétés d'armes nécessaires pour le CombatEngine
    this.fighter1.hasWeapon = !!this.fighter1.weapon;
    this.fighter1.weaponType = this.fighter1.weapon || null;
    this.fighter2.hasWeapon = !!this.fighter2.weapon;
    this.fighter2.weaponType = this.fighter2.weapon || null;
    
    // Engine
    this.engine = new CombatEngine(this.fighter1, this.fighter2);

    // Initialize combat state
    this.stopCombat = false;
    this.turnInProgress = false;
    
    // Start loop
    this.time.delayedCall(200, () => {
      if (!this.stopCombat) {
        this.executeTurn();
      }
    });
  }

  setSpineAnim(spineObj, name, loop=false) {
    try { 
      // Détecter le type de personnage basé sur le dataKey
      const isRaptor = spineObj.dataKey && spineObj.dataKey.includes('raptor');
      
      // Animations disponibles selon le personnage
      const spineboyAnims = ['idle', 'walk', 'run', 'jump', 'death'];
      const raptorAnims = ['roar', 'walk', 'roar-long', 'gun-grab', 'gun-holster', 'jump'];
      
      let actualAnim = name;
      
      if (isRaptor) {
        // Mapping pour Raptor
        switch(name) {
          case 'idle': actualAnim = 'walk'; break; // Walk en boucle pour idle
          case 'run': actualAnim = 'walk'; break;
          case 'walk': actualAnim = 'walk'; break;
          case 'attack': actualAnim = 'roar-long'; break;
          case 'hit': actualAnim = 'roar'; break;
          case 'death': actualAnim = 'roar'; break; // Pas de death anim
          case 'jump': actualAnim = 'walk'; break; // Pas de saut
          case 'dodge': actualAnim = 'walk'; break; // Marche au lieu de saut pour esquive
          default: actualAnim = 'walk'; // Walk par défaut
        }
      } else {
        // Mapping pour Spineboy
        switch(name) {
          case 'hit': actualAnim = 'idle'; break; // Pas de hit anim
          case 'attack': actualAnim = 'run'; break; // Course au lieu de saut pour attaque
          case 'dodge': actualAnim = 'run'; break; // Course au lieu de saut pour esquive
          case 'die': actualAnim = 'death'; break;
          default: 
            if (!spineboyAnims.includes(name)) actualAnim = 'idle';
        }
      }
      
      spineObj.animationState.setAnimation(0, actualAnim, loop);
    } catch(e) { 
      console.log('Anim error:', e); 
      // Fallback
      try {
        const fallback = spineObj.dataKey && spineObj.dataKey.includes('raptor') ? 'roar' : 'idle';
        spineObj.animationState.setAnimation(0, fallback, loop);
      } catch(e2) {}
    }
  }

  // Anim helpers
  playIdle(f) { 
    if (!f.isDead) { // Ne pas jouer idle si le personnage est mort
      this.setSpineAnim(f.sprite, 'idle', true); 
    }
  }
  playRun(f) { 
    if (!f.isDead) {
      this.setSpineAnim(f.sprite, 'run', true); 
    }
  }
  playAttack(f) { 
    if (!f.isDead) {
      // Pas d'animation spéciale pour l'attaque (reste en position d'attaque)
      this.setSpineAnim(f.sprite, 'idle', false);
    }
    // L'animation de l'arme est faite dans executeTurn selon le contexte
  }
  playDeath(f) { 
    // Marquer qu'on a déjà joué l'animation de mort
    f.deathAnimPlayed = true;
    f.isDead = true; // Empêcher toute autre animation
    
    // Adapter l'ombre pour un personnage allongé - seulement pour Spineboy, pas pour le raptor
    if (f.shadow && f.characterType !== 'raptor') {
      // Élargir l'ombre horizontalement car le personnage est allongé
      const currentScaleX = f.shadow.scaleX;
      const currentScaleY = f.shadow.scaleY;
      // Décaler l'ombre quand le personnage meurt
      const deathXOffset = f.side === 'left' ? -100 : 100; // Plus décalé : gauche va plus à gauche, droite va plus à droite
      
      this.tweens.add({
        targets: f.shadow,
        x: f.shadow.x + deathXOffset, // Déplacer l'ombre
        scaleX: currentScaleX * 1.8,  // Moins large qu'avant (personnage allongé)
        scaleY: currentScaleY * 0.8,  // Ombre visible, pas trop plate
        alpha: 0.6,   // Bien visible
        duration: 500,
        ease: 'Power2'
      });
      // S'assurer que l'ombre reste au bon niveau de profondeur
      f.shadow.setDepth(f.sprite.depth - 1);
    } else if (f.shadow) {
      // Pour le raptor, garder l'ombre inchangée
      f.shadow.setDepth(f.sprite.depth - 1);
    }
    
    // Pour Spineboy, juste l'animation death (pas de rotation)
    if (f.characterType !== 'raptor') {
      console.log('Playing death animation for Spineboy');
      this.setSpineAnim(f.sprite, 'death', false);
      // S'assurer que l'animation reste sur death
      f.sprite.animationState.clearListeners();
      f.sprite.animationState.addListener({
        complete: () => {
          // Garder sur la dernière frame de death, ne pas revenir à idle
          f.sprite.animationState.clearTracks();
        }
      });
    } else {
      // Pour Raptor, faire tomber car pas d'anim death
      this.setSpineAnim(f.sprite, 'roar', false);
      this.tweens.add({ 
        targets: f.sprite, 
        y: f.sprite.y + 30,
        alpha: 0.7,
        duration: 500,
        ease: 'Power2'
      });
      // Déplacer aussi l'ombre du raptor
      if (f.shadow) {
        this.tweens.add({ 
          targets: f.shadow, 
          y: f.shadow.y + 30,
          duration: 500,
          ease: 'Power2'
        });
      }
    }
  }
  playHit(f) {
    if (!f.isDead) {
      this.setSpineAnim(f.sprite, 'hit', false);
      this.time.delayedCall(200, () => this.playIdle(f));
    }
  }
  playDodge(f) {
    const dir = f.side === 'left' ? -140 : 140;
    this.playRun(f);
    this.tweens.add({ targets: f.sprite, x: f.sprite.x + dir, yoyo: true, duration: 150, ease: 'Power2', onComplete:()=>this.playIdle(f)});
    this.tweens.add({ targets: f.shadow, x: f.shadow.x + dir, yoyo: true, duration: 150, ease: 'Power2' });
  }
  playBlock(f) { 
    // Animation de blocage plus visible : le personnage se protège
    const originalScaleY = Math.abs(f.sprite.scaleY);
    
    // Le personnage se baisse et se protège
    this.tweens.add({ 
      targets: f.sprite, 
      scaleY: originalScaleY * 0.85, // Se baisser un peu
      duration: 100, 
      yoyo: true, 
      ease: 'Power2' 
    });
    
    // Effet de bouclier lumineux pour montrer le blocage
    const shield = this.add.circle(
      f.sprite.x,
      f.sprite.y - 50,
      40
    );
    shield.setStrokeStyle(3, 0xffd54a, 0.8);
    shield.setAlpha(0.7).setDepth(f.sprite.depth + 10);
    
    this.tweens.add({
      targets: shield,
      scale: 1.5,
      alpha: 0,
      duration: 400,
      ease: 'Power2',
      onComplete: () => shield.destroy()
    });
  }
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

  // MÉCANIQUE OFFICIELLE : Attaque de pet (le pet bouge SEULEMENT pour attaquer)
  async petAttack(owner, target) {
    if (!owner.petSprite) return;
    
    const pet = owner.petSprite;
    const originalX = pet.x;
    const originalY = pet.y;
    
    // Le pet court vers la cible
    const targetX = target.sprite.x + (owner.side === 'left' ? -30 : 30);
    const targetY = target.sprite.y;
    
    await new Promise(res => this.tweens.add({
      targets: [pet, owner.petText],
      x: targetX,
      y: targetY,
      duration: 300,
      ease: 'Power2',
      onComplete: res
    }));
    
    // Animation d'attaque (morsure/griffe)
    this.tweens.add({
      targets: pet,
      scale: 1.3,
      duration: 100,
      yoyo: true,
      ease: 'Power2'
    });
    
    // Flash sur la cible
    this.flashSpine(target.sprite);
    this.shakeLight();
    
    await this.sleep(200);
    
    // Le pet retourne à sa position
    await new Promise(res => this.tweens.add({
      targets: [pet, owner.petText],
      x: originalX,
      y: originalY,
      duration: 300,
      ease: 'Power2',
      onComplete: res
    }));
  }
  
  createWeaponSprites() {
    // Couleurs par type d'arme LaBrute
    const weaponColors = {
      'knife': 0xc0c0c0,        // Argent
      'broadsword': 0x4169e1,   // Bleu royal
      'lance': 0xdaa520,        // Or
      'sai': 0x708090,          // Gris ardoise
      'fan': 0xff69b4,          // Rose
      'shuriken': 0x2f4f4f,     // Gris foncé
      'axe': 0x8b4513,          // Brun
      'bumps': 0x696969,        // Gris
      'flail': 0x2f4f4f,        // Gris ardoise foncé
      'fryingPan': 0x696969,    // Gris
      'hatchet': 0x8b4513,      // Brun
      'mammothBone': 0xfff8dc,  // Cornsilk (os)
      'morningStar': 0x2f4f4f,  // Gris foncé
      'trombone': 0xffd700,     // Or
      'baton': 0x8b7355,        // Bois
      'halberd': 0x4169e1,      // Bleu
      'trident': 0xdaa520,      // Or
      'whip': 0x654321,         // Brun foncé
      'noodleBowl': 0xffffff,   // Blanc
      'piopio': 0xff69b4,       // Rose
      'scimitar': 0xc0c0c0,     // Argent
      'sword': 0x4169e1         // Bleu royal
    };
    
    // Créer les armes DANS LES MAINS (position main droite)
    if (this.fighter1.weapon) {
      const color = weaponColors[this.fighter1.weapon] || 0x888888;
      // Position de la main (environ au niveau du torse)
      const handX = this.fighter1.sprite.x + 25;
      const handY = this.fighter1.sprite.y - 80; // Plus haut, au niveau de la main
      
      const weapon1 = this.add.rectangle(
        handX, 
        handY,
        50, 8, color
      );
      weapon1.setOrigin(0.1, 0.5); // Pivot près de la garde
      weapon1.rotation = -0.785; // 45 degrés vers le haut
      weapon1.setStrokeStyle(2, 0x000000);
      weapon1.setDepth(this.fighter1.sprite.depth + 1); // Devant le personnage
      this.fighter1.weaponSprite = weapon1;
      
      // Créer un container pour grouper l'arme avec le fighter
      this.fighter1.weaponOffsetX = 25; // Offset par rapport au sprite
      this.fighter1.weaponOffsetY = -80;
      
      // Label de l'arme
      const label1 = this.add.text(
        handX,
        handY - 20,
        this.fighter1.weapon.toUpperCase(),
        { fontSize: '9px', color: '#ffffff', stroke: '#000000', strokeThickness: 2 }
      ).setOrigin(0.5).setDepth(this.fighter1.sprite.depth + 1);
      this.fighter1.weaponText = label1;
    }
    
    if (this.fighter2.weapon) {
      const color = weaponColors[this.fighter2.weapon] || 0x888888;
      // Position de la main (environ au niveau du torse)
      const handX = this.fighter2.sprite.x - 25;
      const handY = this.fighter2.sprite.y - 80; // Plus haut, au niveau de la main
      
      const weapon2 = this.add.rectangle(
        handX,
        handY,
        50, 8, color  
      );
      weapon2.setOrigin(0.9, 0.5); // Pivot près de la garde
      weapon2.rotation = 0.785; // 45 degrés vers le haut
      weapon2.setStrokeStyle(2, 0x000000);
      weapon2.setDepth(this.fighter2.sprite.depth + 1); // Devant le personnage
      this.fighter2.weaponSprite = weapon2;
      
      // Créer un container pour grouper l'arme avec le fighter
      this.fighter2.weaponOffsetX = -25; // Offset par rapport au sprite
      this.fighter2.weaponOffsetY = -80;
      
      // Label de l'arme
      const label2 = this.add.text(
        handX,
        handY - 20,
        this.fighter2.weapon.toUpperCase(),
        { fontSize: '9px', color: '#ffffff', stroke: '#000000', strokeThickness: 2 }
      ).setOrigin(0.5).setDepth(this.fighter2.sprite.depth + 1);
      this.fighter2.weaponText = label2;
    }
    
    // Créer les pets avec des formes et animations différentes selon le type
    const petColors = {
      'dog': 0x8B4513,    // Marron
      'dog1': 0x8B4513,   // Chien niveau 1
      'dog2': 0x964B00,   // Chien niveau 2
      'dog3': 0x654321,   // Chien niveau 3
      'bear': 0x4B3621,   // Brun foncé pour ours
      'panther': 0x1a1a1a // Noir pour panthère
    };
    
    if (this.fighter1.pet) {
      const petColor = petColors[this.fighter1.pet] || 0x666666;
      const petSize = this.fighter1.pet.includes('bear') ? 30 : (this.fighter1.pet.includes('panther') ? 25 : 20);
      const pet1 = this.add.circle(
        this.fighter1.sprite.x - 60,
        this.fighter1.sprite.y + 30,
        petSize, petColor
      );
      pet1.setStrokeStyle(2, 0xffffff);
      this.fighter1.petSprite = pet1;
      
      // Animation d'idle pour le pet (respiration/mouvement)
      this.tweens.add({
        targets: pet1,
        scaleX: 1.1,
        scaleY: 0.9,
        duration: 1000 + Math.random() * 500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      
      // Label du pet
      const petLabel1 = this.add.text(
        this.fighter1.sprite.x - 60,
        this.fighter1.sprite.y + 55,
        this.fighter1.pet.toUpperCase(),
        { fontSize: '10px', color: '#ffffff', stroke: '#000000', strokeThickness: 2 }
      ).setOrigin(0.5);
      this.fighter1.petText = petLabel1;
    }
    
    if (this.fighter2.pet) {
      const petColor = petColors[this.fighter2.pet] || 0x666666;
      const petSize = this.fighter2.pet.includes('bear') ? 30 : (this.fighter2.pet.includes('panther') ? 25 : 20);
      const pet2 = this.add.circle(
        this.fighter2.sprite.x + 60,
        this.fighter2.sprite.y + 30,
        petSize, petColor
      );
      pet2.setStrokeStyle(2, 0xffffff);
      this.fighter2.petSprite = pet2;
      
      // Animation d'idle pour le pet (respiration/mouvement)
      this.tweens.add({
        targets: pet2,
        scaleX: 1.1,
        scaleY: 0.9,
        duration: 1000 + Math.random() * 500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      
      // Label du pet
      const petLabel2 = this.add.text(
        this.fighter2.sprite.x + 60,
        this.fighter2.sprite.y + 55,
        this.fighter2.pet.toUpperCase(),
        { fontSize: '10px', color: '#ffffff', stroke: '#000000', strokeThickness: 2 }
      ).setOrigin(0.5);
      this.fighter2.petText = petLabel2;
    }
  }
  
  sleep(ms) { return new Promise(res => this.time.delayedCall(ms, res)); }
  killFighterTweens(f) { this.tweens.killTweensOf(f.sprite); if (f.shadow) this.tweens.killTweensOf(f.shadow); }
  moveFighterTo(f, x, y, duration, ease='Linear') {
    this.killFighterTweens(f);
    // Utiliser l'échelle de base stockée pour ce personnage spécifique
    const fighterBaseScale = f.sprite.baseScale || Math.abs(f.sprite.scaleX / this.getFighterScale(f.sprite.y));
    const scaleSign = f.sprite.scaleX < 0 ? -1 : 1;
    
    const p1 = new Promise(res => this.tweens.add({ 
      targets: f.sprite, 
      x, 
      y, 
      duration, 
      ease,
      onUpdate: () => {
        // Update scale based on current Y position during movement
        const currentY = f.sprite.y;
        const newScale = fighterBaseScale * this.getFighterScale(currentY);
        f.sprite.setScale(newScale * scaleSign, newScale);
        
        // FAIRE SUIVRE L'ARME - elle reste COLLÉE au personnage
        if (f.weaponSprite && !f.weaponThrown) {
          const xOffset = f.side === 'left' ? 25 : -25;
          f.weaponSprite.x = f.sprite.x + xOffset;
          f.weaponSprite.y = f.sprite.y - 80;
        }
        if (f.weaponText && !f.weaponThrown) {
          const xOffset = f.side === 'left' ? 25 : -25;
          f.weaponText.x = f.sprite.x + xOffset;
          f.weaponText.y = f.sprite.y - 100;
        }
        // MÉCANIQUE OFFICIELLE : Les pets restent FIXES et ne bougent que pour attaquer
      },
      onComplete: res 
    }));
    
    const sScale = this.getShadowScale(y);
    // Décalage selon le côté et le type de personnage (inversé)
    const isRaptor = f.characterType === 'raptor';
    const shadowXOffset = f.side === 'left' ? (isRaptor ? 10 : 2) : (isRaptor ? -10 : -2);
    // Adapter l'échelle selon le type de personnage
    const shadowScaleX = sScale * (isRaptor ? 1.6 : 1.0); // Plus large pour le raptor
    const shadowScaleY = sScale * (isRaptor ? 0.48 : 0.4); // Plus épais pour Spineboy aussi
    const p2 = f.shadow ? new Promise(res => this.tweens.add({ 
      targets: f.shadow, 
      x: x + shadowXOffset, 
      y: y + this.getShadowOffset(y), 
      scaleX: shadowScaleX,
      scaleY: shadowScaleY,
      duration, 
      ease, 
      onComplete: res 
    })) : Promise.resolve();
    
    return Promise.all([p1, p2]);
  }
  estimateHalfWidth(f) {
    const sx = Math.abs(f.sprite.scaleX || 1);
    return Math.max(24, 100 * sx);
  }
  getContactGap(attacker, target, margin=12) {
    const halfA = this.estimateHalfWidth(attacker);
    const halfT = this.estimateHalfWidth(target);
    // Plus de distance si un raptor est impliqué
    const attackerIsRaptor = attacker.characterType === 'raptor';
    const targetIsRaptor = target.characterType === 'raptor';
    // Encore plus de distance si DEUX raptors se battent
    let raptorBonus = 0;
    if (attackerIsRaptor && targetIsRaptor) {
      raptorBonus = 150; // Distance énorme entre deux raptors
    } else if (attackerIsRaptor || targetIsRaptor) {
      raptorBonus = 90; // Grande distance avec un seul raptor
    }
    return halfA + halfT + margin + raptorBonus;
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

    if (!result) { 
      this.turnInProgress = false; 
      await this.sleep(140); 
      return this.executeTurn(); 
    }
    
    const attacker = result.attacker; const target = result.target;

    if (result.type === 'attack' || result.type === 'multi_attack' || result.type === 'counter') {
      // Affichage clair de l'action avec l'arme utilisée
      const weaponName = attacker.weaponType ? ` avec ${attacker.weaponType}` : ' à mains nues';
      this.appendLog(`${attacker.stats.name} attaque${weaponName} ${target.stats.name}${result.type==='multi_attack'?' (combo)':''}${result.critical?' [CRIT]':''}${result.hit?` et inflige ${result.damage} dégâts`:" mais rate"}`);

      const contactGap = this.getContactGap(attacker, target, 14);
      // Pas de décalage Y - reste sur la même ligne horizontale
      const contactY = target.sprite.y;
      const attackX = target.sprite.x + (attacker.side === 'left' ? -contactGap : contactGap);
      const distance = Math.abs(attackX - attacker.sprite.x);
      // Vitesse LaBrute officielle : rapide comme l'éclair
      const LABRUTE_SPEED = 1500; // pixels/seconde (vitesse d'attaque)
      const runDuration = Math.max(80, (distance / LABRUTE_SPEED) * 1000);

      this.playRun(attacker);
      await this.moveFighterTo(attacker, attackX, contactY, runDuration, 'Linear');
      
      // Mettre l'attaquant au premier plan (devant la cible)
      // Beaucoup plus de depth pour les raptors pour être sûr qu'ils soient devant
      const depthBonus = attacker.characterType === 'raptor' ? 50 : 10;
      attacker.sprite.setDepth(target.sprite.depth + depthBonus);
      if (attacker.shadow) attacker.shadow.setDepth(attacker.sprite.depth - 1);
      if (attacker.weaponSprite) attacker.weaponSprite.setDepth(attacker.sprite.depth + 1);
      
      // Animation d'attaque avec effet visuel de l'arme
      this.playAttack(attacker);
      
      // Effet visuel de l'arme qui frappe
      if (attacker.weaponSprite && attacker.hasWeapon) {
        // Flash de l'arme pour montrer qu'elle est utilisée
        this.tweens.add({
          targets: attacker.weaponSprite,
          scaleX: 1.5,
          scaleY: 1.5,
          duration: 100,
          yoyo: true,
          ease: 'Power2'
        });
      }

      if (result.hit && result.damage > 0) {
        // Debug log pour vérifier les dégâts
        console.log(`HIT: ${attacker.stats.name} -> ${target.stats.name}: ${result.damage} dmg (HP: ${target.stats.health}/${target.stats.maxHealth})`);
        
        // MISE À JOUR INSTANTANÉE AU MOMENT DU HIT - SEULEMENT LA CIBLE
        this.updateFighterHP(target); // SEULEMENT la barre de la CIBLE descend !
        
        // Affichage des dégâts au-dessus du personnage
        this.showDamageText(target, result.damage, result.critical);
        
        // Animations visuelles simultanées
        this.playHit(target);
        this.flashSpine(target.sprite);
        
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
        
        // Vérifier si mort
        if (target.stats.health <= 0) {
          this.playDeath(target);
        }
      } else if (result.type !== 'dodge') {
        this.showMissEffect(target);
        this.playEvadeTick(target);
      }

      // playAttack déjà fait au moment du contact
      await this.sleep(20); // Lightning transition
      await this.returnToPosition(attacker);
      
      // Vérifier si l'attaquant est mort (peut arriver avec des contres)
      if (attacker.stats.health <= 0 && !attacker.deathAnimPlayed) {
        this.playDeath(attacker);
      }

    } else if (result.type === 'block') {
      this.appendLog(`${target.stats.name} bloque l'attaque de ${attacker.stats.name}`);
      
      // L'ATTAQUANT DOIT TENTER D'ATTAQUER (comme pour dodge)
      const contactGap = this.getContactGap(attacker, target, 14);
      const attackX = target.sprite.x + (attacker.side === 'left' ? -contactGap : contactGap);
      const contactY = target.sprite.y;
      
      // L'attaquant se déplace pour attaquer
      const blockDistance = Math.abs(attackX - attacker.sprite.x);
      const LABRUTE_SPEED = 1500; // pixels/seconde
      const blockDuration = Math.max(80, (blockDistance / LABRUTE_SPEED) * 1000);
      this.playRun(attacker);
      await this.moveFighterTo(attacker, attackX, contactY, blockDuration, 'Linear');
      
      // Mettre l'attaquant au premier plan
      const depthBonus = attacker.characterType === 'raptor' ? 50 : 10;
      attacker.sprite.setDepth(target.sprite.depth + depthBonus);
      if (attacker.shadow) attacker.shadow.setDepth(attacker.sprite.depth - 1);
      if (attacker.weaponSprite) attacker.weaponSprite.setDepth(attacker.sprite.depth + 1);
      
      // Animation d'attaque bloquée
      this.playAttack(attacker);
      
      // La cible BLOQUE visiblement
      this.playBlock(target);
      this.showBlockIndicator(target);
      
      // MÉCANIQUES OFFICIELLES LABRUTE : Blocage simple
      // Pas de recul dans LaBrute officiel pour le block
      // Si la cible a une arme, elle la lève légèrement pour bloquer
      if (target.weaponSprite) {
        const originalRotation = target.weaponSprite.rotation;
        const originalY = target.weaponSprite.y;
        this.tweens.add({
          targets: target.weaponSprite,
          rotation: target.side === 'left' ? -1.2 : 1.2, // Lever légèrement (pas 90°)
          y: originalY - 15, // Lever un peu l'arme
          duration: 150,
          ease: 'Sine.easeInOut',
          yoyo: true,
          onComplete: () => {
            target.weaponSprite.rotation = originalRotation;
            target.weaponSprite.y = originalY;
          }
        });
      }
      
      await this.sleep(250);
      
      // L'attaquant retourne à sa position
      await this.returnToPosition(attacker);
      
      // Vérifier si l'attaquant est mort
      if (attacker.stats.health <= 0 && !attacker.deathAnimPlayed) {
        this.playDeath(attacker);
      }
      
      // Rétablir l'ordre de profondeur après un délai pour laisser voir l'attaque
      this.time.delayedCall(300, () => this.updateDepthOrdering());
    } else if (result.type === 'dodge') {
      this.appendLog(`${target.stats.name} esquive l'attaque de ${attacker.stats.name}`);
      
      // L'attaquant doit d'abord tenter d'attaquer
      const contactGap = this.getContactGap(attacker, target, 14);
      const attackX = target.sprite.x + (attacker.side === 'left' ? -contactGap : contactGap);
      const contactY = target.sprite.y;
      
      const dodgeDistance = Math.abs(attackX - attacker.sprite.x);
      const LABRUTE_SPEED = 1500; // pixels/seconde
      const dodgeDuration = Math.max(80, (dodgeDistance / LABRUTE_SPEED) * 1000);
      this.playRun(attacker);
      await this.moveFighterTo(attacker, attackX, contactY, dodgeDuration, 'Linear');
      
      // Mettre l'attaquant au premier plan
      const depthBonus = attacker.characterType === 'raptor' ? 50 : 10;
      attacker.sprite.setDepth(target.sprite.depth + depthBonus);
      if (attacker.shadow) attacker.shadow.setDepth(attacker.sprite.depth - 1);
      if (attacker.weaponSprite) attacker.weaponSprite.setDepth(attacker.sprite.depth + 1);
      
      // Puis la cible esquive
      this.playDodge(target);
      this.createDodgeIndicator(target);
      
      // L'attaquant retourne
      await this.sleep(150);
      await this.returnToPosition(attacker);
      
      // Vérifier si l'attaquant est mort (peut arriver avec des contres ou autres)
      if (attacker.stats.health <= 0 && !attacker.deathAnimPlayed) {
        this.playDeath(attacker);
      }
      
      // Rétablir l'ordre de profondeur après un délai
      this.time.delayedCall(300, () => this.updateDepthOrdering());
    } else if (result.type === 'throw') {
      // Message clair pour le lancer d'arme
      const weaponThrown = attacker.weaponType || 'son arme';
      this.appendLog(`🎯 ${attacker.stats.name} LANCE ${weaponThrown} sur ${target.stats.name}${result.hit?` et inflige ${result.damage} dégâts`:" mais rate"}`);
      
      // Animation VISIBLE du lancer d'arme - L'ATTAQUANT NE BOUGE PAS
      if (attacker.weaponSprite) {
        // Pas d'animation spéciale pour le personnage, on se concentre sur l'arme
        
        // Utiliser directement l'arme existante pour le lancer
        const thrownWeapon = attacker.weaponSprite;
        thrownWeapon.setDepth(200); // Au-dessus de tout
        
        // Trajectoire parabolique de l'arme
        const startX = thrownWeapon.x;
        const startY = thrownWeapon.y;
        const endX = result.hit ? target.sprite.x : target.sprite.x + Phaser.Math.Between(-200, 200);
        const endY = result.hit ? target.sprite.y - 50 : this.scale.height + 100;
        const midX = (startX + endX) / 2;
        const midY = Math.min(startY, endY) - 150; // Point haut de la parabole
        
        // Animation de vol avec rotation
        this.tweens.add({
          targets: thrownWeapon,
          x: endX,
          y: endY,
          rotation: thrownWeapon.rotation + (Math.PI * 6), // 3 tours complets
          duration: 800,
          ease: 'Quad.easeIn',
          onUpdate: (tween) => {
            // Trajectoire parabolique manuelle
            const progress = tween.progress;
            const x = Phaser.Math.Interpolation.Linear([startX, midX, endX], progress);
            const y = Phaser.Math.Interpolation.Bezier([startY, midY, endY], progress);
            thrownWeapon.x = x;
            thrownWeapon.y = y;
          },
          onComplete: () => {
            // Effet d'impact ou disparition
            if (result.hit) {
              // Petit effet d'impact
              this.cameras.main.shake(100, 0.01);
            }
            
            // Vérifier si c'est une arme de type "thrown" qui reste
            const thrownWeapons = ['shuriken', 'piopio', 'noodleBowl'];
            if (thrownWeapons.includes(attacker.weaponType)) {
              // L'arme revient au personnage (comme un yo-yo ou boomerang)
              this.tweens.add({
                targets: thrownWeapon,
                x: attacker.sprite.x,
                y: attacker.sprite.y - 50,
                rotation: thrownWeapon.rotation + (Math.PI * 4),
                duration: 600,
                ease: 'Power2',
                onComplete: () => {
                  // Repositionner l'arme normalement
                  if (attacker.weaponSprite) {
                    attacker.weaponSprite.x = attacker.sprite.x;
                    attacker.weaponSprite.y = attacker.sprite.y - 50;
                    attacker.weaponSprite.setDepth(attacker.sprite.depth + 1);
                  }
                }
              });
            } else {
              // Arme normale disparaît
              thrownWeapon.destroy();
              attacker.weaponSprite = null;
            }
            if (attacker.weaponText) {
              attacker.weaponText.destroy();
              attacker.weaponText = null;
            }
            attacker.hasWeapon = false;
            attacker.weapon = null;
          }
        });
        
        // Attendre un peu avant de montrer les dégâts
        await this.sleep(400);
      }
      
      if (result.hit && result.damage>0) { 
        this.updateFighterHP(target);
        this.flashSpine(target.sprite); 
        this.shakeMedium(); 
        this.showDamageNumber(target, result.damage, !!result.critical);
      }
      else { 
        this.showMissEffect(target);
        this.appendLog(`L'arme manque sa cible et disparaît !`);
      }
    } else if (result.type === 'special') {
      this.appendLog(`${attacker.stats.name} utilise une capacité spéciale !`);
      this.cameras.main.shake(130, 0.004);
      await this.sleep(140);
    }

    // Vérifier si il y a une action de pet
    if (result.petAssist) {
      await this.sleep(200);
      this.appendLog(`🐾 Le ${result.petAssist.petType || 'pet'} de ${attacker.stats.name} attaque et inflige ${result.petAssist.damage} dégâts!`);
      
      // Animation du pet qui attaque
      if (attacker.petSprite) {
        this.tweens.add({
          targets: attacker.petSprite,
          x: target.sprite.x + (attacker.side === 'left' ? -80 : 80),
          y: target.sprite.y,
          duration: 300,
          yoyo: true,
          ease: 'Power2',
          onYoyo: () => {
            if (result.petAssist.damage > 0) {
              this.showDamageText(target, result.petAssist.damage, false);
              this.updateFighterHP(target);
            }
          }
        });
      }
    }
    
    // Pas de mise à jour finale - tout est déjà synchronisé
    
    if (result.gameOver) {
      // Attendre que la dernière animation se termine
      await this.sleep(500);
      
      this.combatOver = true;
      // Mise à jour finale pour s'assurer que les barres sont correctes
      this.updateUI();
      
      // Animation de défaite pour le perdant
      const loser = result.winner === this.fighter1 ? this.fighter2 : this.fighter1;
      const winner = result.winner === this.fighter1 ? this.fighter1 : this.fighter2;
      
      // Jouer l'animation de défaite pour le perdant (seulement si pas déjà fait)
      if (loser && loser.sprite && !loser.deathAnimPlayed) {
        // Pour Spineboy, utiliser death
        // Pour Raptor, utiliser une animation de défaite
        const isRaptor = loser.characterType === 'raptor';
        
        if (isRaptor) {
          // Le raptor fait un rugissement long de défaite
          this.setSpineAnim(loser.sprite, 'roar-long', false);
          // Puis le faire tomber
          this.tweens.add({
            targets: loser.sprite,
            y: loser.sprite.y + 50,
            alpha: 0.5,
            duration: 800,
            ease: 'Power2'
          });
        } else {
          // Spineboy a une vraie animation death
          this.setSpineAnim(loser.sprite, 'death', false);
        }
      }
      
      // Animation de victoire pour le gagnant (optionnel)
      if (winner && winner.sprite) {
        // Pour le raptor, faire un rugissement de victoire
        const isRaptorWinner = winner.characterType === 'raptor';
        if (isRaptorWinner) {
          this.setSpineAnim(winner.sprite, 'roar', false);
          // Retour à idle après le rugissement
          this.time.delayedCall(800, () => {
            if (winner.sprite) {
              this.setSpineAnim(winner.sprite, 'idle', true);
            }
          });
        } else {
          // Spineboy reste en idle (pas de jump qui bug)
          this.setSpineAnim(winner.sprite, 'idle', true);
        }
      }
      
      // Message de victoire plus visible
      const winText = this.add.text(this.scale.width/2, 120, `🏆 ${result.winner.stats.name} WINS! 🏆`, { 
        fontSize: '36px', 
        color: '#ffff00',
        stroke: '#000000',
        strokeThickness: 4
      }).setOrigin(0.5);
      
      // Animation du texte de victoire
      this.tweens.add({
        targets: winText,
        scale: 1.2,
        duration: 500,
        yoyo: true,
        repeat: -1
      });
      
      // Hide combat controls
      if (window.hideCombatControls) {
        window.hideCombatControls();
      }
      
      // Add end combat buttons
      const btnY = 180;
      const returnBtn = this.add.text(this.scale.width/2 - 120, btnY, '[ Return to Menu ]', { fontSize: '20px', color: '#00ff88' })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerup', () => {
          this.scene.start('WaitingScene');
          // Redirect to home page
          window.location.href = '/home.html';
        });
        
      // Utiliser la fonction rematch du système RematchFix
      const rematchBtn = setupRematchButton(this, this.scale.width/2 + 120, btnY);
      
      return;
    }

    this.turnInProgress = false;
    await this.sleep(160);
    return this.executeTurn();
  }

  showDodgeChanceIndicator(defender, dodgeChance, dodgeAttempted, dodgeSuccess) {}
  showBlockChanceIndicator(defender, blockChance, blockAttempted, blockSuccess, hasStamina) {}

  getFighterScale(y) { const n = (y - this.combatZone.minY) / (this.combatZone.maxY - this.combatZone.minY); return 0.92 + (n * 0.15); } // Effet de profondeur subtil (15%)
  getShadowScale(y) { 
    // L'ombre suit la même échelle que le personnage pour garder les proportions
    return this.getFighterScale(y); 
  }
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
    const LABRUTE_RETURN_SPEED = 2200; // pixels/seconde (retour plus rapide que l'aller)
    const duration = Math.max(60, (dist / LABRUTE_RETURN_SPEED) * 1000);
    
    // Utiliser walk au lieu de run pour le retour (plus naturel, surtout pour le Raptor)
    const isRaptor = fighter.characterType === 'raptor';
    if (isRaptor) {
      // Pour le Raptor, utiliser walk pour éviter le saut
      this.setSpineAnim(fighter.sprite, 'walk', true);
    } else {
      // Pour Spineboy, continuer avec run
      this.playRun(fighter);
    }
    
    // Déplacer le personnage avec les armes/pets qui suivent
    await this.moveFighterTo(fighter, targetX, targetY, duration, 'Linear');
    
    this.playIdle(fighter);
    this.updateDepthOrdering();
  }

  // UI that adapts to canvas width
  createSimpleUI(W, H) {
    const margin = Math.round(W * 0.0625); // ~80 when W=1280
    const barWidth = Math.round(W * 0.28); // ~358 when W=1280
    const barHeight = 26;
    
    // Barre gauche : origin(0,0.5) = se vide de droite à gauche (partie gauche reste) ✓
    const f1bg = this.add.rectangle(margin, 40, barWidth, barHeight, 0x222222).setOrigin(0,0.5);
    const f1 = this.add.rectangle(margin, 40, barWidth, barHeight, 0x00e676).setOrigin(0,0.5).setStrokeStyle(2, 0x000000, 0.8);
    
    // Barre droite : TECHNIQUE DIFFÉRENTE pour se vider depuis la gauche
    const rightBarX = W - margin - barWidth;
    const f2bg = this.add.rectangle(rightBarX, 40, barWidth, barHeight, 0x222222).setOrigin(0,0.5);
    // Barre rouge PLEINE en dessous
    const f2full = this.add.rectangle(rightBarX, 40, barWidth, barHeight, 0xff5252).setOrigin(0,0.5).setStrokeStyle(2, 0x000000, 0.8);
    // Masque noir qui grandit depuis la gauche pour cacher la partie perdue
    const f2mask = this.add.rectangle(rightBarX, 40, 0, barHeight, 0x222222).setOrigin(0,0.5);
    
    // On stocke le masque dans f2 pour pouvoir l'animer
    const f2 = { mask: f2mask, full: f2full, isRightBar: true };
    
    const f1t = this.add.text(margin, 16, this.fighter1.stats.name, { fontSize:'16px', color:'#fff' }).setOrigin(0,0.5);
    const f2t = this.add.text(W - margin, 16, this.fighter2.stats.name, { fontSize:'16px', color:'#fff' }).setOrigin(1,0.5);
    this.logBox = this.add.rectangle(W/2, H - 20, W - margin*0.8, 44, 0x000000, 0.35).setStrokeStyle(2, 0xffffff, 0.2);
    this.logText = this.add.text(margin * 0.6, H - 36, '', { fontSize:'16px', color:'#fff' });
    return { f1, f2, f1bg, f2bg, f1t, f2t, w: barWidth };
  }
  appendLog(line) { if (this.logText) this.logText.setText(line); }

  updateFighterHP(fighter) {
    // Met à jour SEULEMENT la barre du combattant spécifié
    const isF1 = (fighter === this.fighter1);
    const healthBar = isF1 ? this.ui.f1 : this.ui.f2;
    const stats = fighter.stats;
    
    const healthPercent = Math.max(0, stats.health) / stats.maxHealth;
    const newWidth = this.ui.w * Math.max(0, Math.min(1, healthPercent));
    
    if (!isF1 && healthBar.isRightBar) {
      // Pour la barre droite : on anime le MASQUE qui grandit depuis la gauche
      const maskWidth = this.ui.w * (1 - healthPercent); // Largeur du masque = partie perdue
      
      this.tweens.add({
        targets: healthBar.mask,
        width: maskWidth,
        duration: 50, // TRÈS RAPIDE
        ease: 'Power2'
      });
    } else {
      // Pour la barre gauche : comportement normal
      this.tweens.add({
        targets: healthBar,
        width: newWidth,
        duration: 50, // TRÈS RAPIDE
        ease: 'Power2'
      });
    }
  }
  
  updateUI() {
    // Met à jour les DEUX barres (utilisé seulement au début ou à la fin)
    this.updateFighterHP(this.fighter1);
    this.updateFighterHP(this.fighter2);
  }

  showDamageNumber(target, amount, critical=false) {
    const t = this.add.text(target.sprite.x, target.sprite.y - 80, `${amount}`, { fontSize: critical ? '28px' : '22px', color: critical ? '#ffcc00' : '#ffffff', stroke:'#000', strokeThickness:3 }).setOrigin(0.5).setDepth(2000);
    this.tweens.add({ targets: t, y: t.y - 40, alpha: 0, duration: 600, ease: 'Power2', onComplete: () => t.destroy() });
  }
  
  showDamageText(target, amount, critical=false) {
    // Affichage amélioré des dégâts avec effet visuel
    const color = critical ? '#ffff00' : '#ff4444';
    const fontSize = critical ? '36px' : '28px';
    const text = critical ? `${amount}!` : `-${amount}`;
    
    const damageText = this.add.text(
      target.sprite.x, 
      target.sprite.y - 100, 
      text, 
      { 
        fontSize: fontSize, 
        color: color, 
        fontWeight: 'bold',
        stroke: '#000000', 
        strokeThickness: 4 
      }
    ).setOrigin(0.5).setDepth(3000);
    
    // Animation du texte de dégâts
    this.tweens.add({ 
      targets: damageText, 
      y: damageText.y - 60, 
      alpha: 0, 
      scale: critical ? 1.5 : 1.2,
      duration: 800, 
      ease: 'Power2', 
      onComplete: () => damageText.destroy() 
    });
  }
  
  shutdown() {
    // Nettoyer le background GIF si utilisé
    if (this.isUsingGifBackground && window.hideGifBackground) {
      window.hideGifBackground();
    }
  }
}

