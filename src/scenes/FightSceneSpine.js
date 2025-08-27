import Phaser from 'phaser';
import LaBruteClientEngine from '../engine/LaBruteClientEngine.js';
import LaBruteOfficialAdapter from '../engine/LaBruteOfficialAdapter.js';
import { setupRematchButton, saveInitialStats } from './RematchFix.js';

// Combat scene powered by LaBruteClientEngine (MMO Architecture - Server-side combat)
// This scene only handles animation and rendering - no combat calculations
export class FightSceneSpine extends Phaser.Scene {
  constructor() { super({ key: 'FightSpine' }); }

  init(data) {
    // IMPORTANT: Réinitialiser toutes les variables de combat pour éviter la persistance
    this.combatOver = false;
    this.animationInProgress = false;
    this.stopCombat = false;
    this._recoveryActive = false;
    this._cancelAnims = false;
    this._cancelUntilTs = 0; // short quarantine window after recovery to force bail-outs
    this.debugAnims = false; // enable for very verbose step/guard logging
    this._debug = { pending: new Map(), nextId: 1 };
    this._currentStepIndex = -1;
    this.clientEngine = null; // Nouveau client engine (MMO)
    this.fighter1 = null;
    this.fighter2 = null;
    this.currentFightData = null; // Données reçues du serveur
    this.fighterHP = [100, 100]; // HP actuel des combattants
    this.maxHP = [100, 100]; // HP maximum
    this.hpBars = []; // Barres de vie visuelles
    
    console.log('=== SCENE INITIALIZED - Combat variables reset ===' );
    
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
    
    // IMPORTANT: Réinitialiser la caméra pour éviter les shakes résiduels du combat précédent
    this.cameras.main.stopFollow();
    this.cameras.main.resetFX();
    
    // Show combat controls
    if (window.showCombatControls) {
      window.showCombatControls();
    }

    // Debug toggles (optional)
    if (typeof window !== 'undefined') {
      window.enableFightAnimDebug = (on = true) => { this.debugAnims = !!on; console.warn(`[AnimDebug] ${on ? 'ENABLED' : 'DISABLED'}`); };
      window.dumpPendingAnimHelpers = () => { try { console.log('Pending anim helpers:', Array.from(this._debug?.pending?.values() || [])); } catch (_) {} };
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

    // Utiliser uniquement spineboy
    const spineboyChar = { data: 'spineboy-data', atlas: 'spineboy-atlas', scale: 1.0, type: 'spineboy' };
    
    // Les deux combattants utilisent spineboy
    const leftCharType = 'spineboy';
    const rightCharType = 'spineboy';
    
    const leftChar = spineboyChar;
    const rightChar = spineboyChar;

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
    // Décalage pour spineboy
    const leftShadowXOffset = 2; // Vers la droite pour le perso de gauche
    const rightShadowXOffset = -2; // Vers la gauche pour le perso de droite
    
    // Taille standard pour spineboy
    const leftShadowScale = 1.0;
    const rightShadowScale = 1.0;
    
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

    // Idle anims pour tous les personnages
    this.setSpineAnim(left, 'idle', true);
    this.setSpineAnim(right, 'idle', true);

    // Fighters for engine - inclure le type de personnage
    this.fighter1 = { 
      sprite: left, 
      shadow: shadowL, 
      side: 'left', 
      scene: this, 
      baseX: leftBaseX, 
      baseY: leftBaseY, 
      baseScale,
      characterType: 'spineboy',
      hp: this.initialA?.hp || 100,
      maxHp: this.initialA?.hp || 100,
      index: 0
    };
    this.fighter2 = { 
      sprite: right, 
      shadow: shadowR, 
      side: 'right', 
      scene: this, 
      baseX: rightBaseX, 
      baseY: rightBaseY, 
      baseScale,
      characterType: 'spineboy',
      hp: this.initialB?.hp || 100,
      maxHp: this.initialB?.hp || 100,
      index: 1
    };
    
    // Initialiser les HP
    this.fighterHP[0] = this.fighter1.hp;
    this.fighterHP[1] = this.fighter2.hp;
    this.maxHP[0] = this.fighter1.maxHp;
    this.maxHP[1] = this.fighter2.maxHp;

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
    
    // Initialisation simple des HP

    this.updateDepthOrdering();

    // UI adapted to width
    this.ui = this.createSimpleUI(W, H);
    this.appendLog('Combat prêt.');
    
    // NE PAS appeler updateUI avant que le moteur soit créé
    console.log(`Combat Start - ${this.fighter1.stats.name}: ${this.fighter1.stats.health}/${this.fighter1.stats.maxHealth} HP`);
    console.log(`Combat Start - ${this.fighter2.stats.name}: ${this.fighter2.stats.health}/${this.fighter2.stats.maxHealth} HP`);

    // Attribution ALÉATOIRE des armes et pets (beaucoup combattent à mains nues dans LaBrute!)
    // Utiliser les armes officielles LaBrute avec 50% de chance d'avoir une arme
    const labruteWeapons = ['knife', 'broadsword', 'lance', 'fan', 'sai', 'shuriken', 
                           'axe', 'bumps', 'flail', 'mammothBone', 'halberd', 'whip'];
    const weapons = [...labruteWeapons, null, null]; // 50% chance d'avoir une arme
    // AUGMENTÉ : 40% de chance d'avoir un pet (pour tester)
    const pets = ['dog', 'dog', 'bear', 'panther', null, null, null, null, null, null]; 
    
    // Armes aléatoires
    this.fighter1.weapon = weapons[Math.floor(Math.random() * weapons.length)];
    this.fighter2.weapon = weapons[Math.floor(Math.random() * weapons.length)];
    
    // Pets aléatoires
    this.fighter1.pet = pets[Math.floor(Math.random() * pets.length)];
    this.fighter2.pet = pets[Math.floor(Math.random() * pets.length)];
    
    // Transmettre les armes au moteur - IMPORTANT: weapons est un tableau pour LaBruteCombatEngine
    this.fighter1.weapons = this.fighter1.weapon ? [this.fighter1.weapon] : [];
    this.fighter2.weapons = this.fighter2.weapon ? [this.fighter2.weapon] : [];
    this.fighter1.stats.weapons = this.fighter1.weapons;
    this.fighter2.stats.weapons = this.fighter2.weapons;
    
    // Transmettre les pets au moteur - IMPORTANT: sur le fighter directement pour LaBruteCombatEngine
    this.fighter1.pet = this.fighter1.pet; // Déjà défini
    this.fighter2.pet = this.fighter2.pet; // Déjà défini
    this.fighter1.stats.pet = this.fighter1.pet;
    this.fighter2.stats.pet = this.fighter2.pet;
    
    // Sprites d'armes supprimés - utilisation des animations Spine uniquement
    
    // Ajouter les propriétés d'armes nécessaires pour le CombatEngine
    this.fighter1.hasWeapon = !!this.fighter1.weapon;
    this.fighter1.weaponType = this.fighter1.weapon || null;
    this.fighter2.hasWeapon = !!this.fighter2.weapon;
    this.fighter2.weaponType = this.fighter2.weapon || null;
    
    // NE PAS créer de nouvelles barres vertes - les barres existent déjà en haut !
    
    // Initialize BOTH engines for transition
    // TODO: Remove clientEngine once officialAdapter is fully tested
    this.clientEngine = new LaBruteClientEngine();
    
    // Initialize the OFFICIAL LaBrute engine adapter
    this.officialAdapter = new LaBruteOfficialAdapter();
    
    // Set up step animation callbacks for client engine (legacy)
    this.clientEngine.onStepCallback = async (step, index) => {
      return await this.animateStep(step, index);
    };
    
    this.clientEngine.onFightEndCallback = (fightData) => {
      this.handleFightEnd(fightData);
    };

    // Initialize combat state
    this.stopCombat = false;
    this.animationInProgress = false;
    
    // Initialize UI with initial fighter stats - s'assurer que les HP sont bien définis
    console.log(`🔥 Initial HP - ${this.fighter1.stats.name}: ${this.fighter1.stats.health}/${this.fighter1.stats.maxHealth}`);
    console.log(`🔥 Initial HP - ${this.fighter2.stats.name}: ${this.fighter2.stats.health}/${this.fighter2.stats.maxHealth}`);
    this.updateUI();
    this.combatOver = false;
    
    // Start the server-side combat request
    this.time.delayedCall(500, () => {
      console.log('╔═══════════════════════════════════════════════════════╗');
      console.log('║        🔥 STARTING SERVER-SIDE COMBAT REQUEST 🔥        ║');
      console.log('╠═══════════════════════════════════════════════════════╣');
      console.log(`║ Fighter 1: ${this.fighter1.stats.name}`);
      console.log(`║   HP: ${this.fighter1.stats.health}/${this.fighter1.stats.maxHealth}`);
      console.log(`║   Position: (${Math.round(this.fighter1.sprite.x)}, ${Math.round(this.fighter1.sprite.y)})`);
      console.log(`║ Fighter 2: ${this.fighter2.stats.name}`);
      console.log(`║   HP: ${this.fighter2.stats.health}/${this.fighter2.stats.maxHealth}`);
      console.log(`║   Position: (${Math.round(this.fighter2.sprite.x)}, ${Math.round(this.fighter2.sprite.y)})`);
      console.log('╚═══════════════════════════════════════════════════════╝');
      this.startServerFight();
    });
  }

  // SUPPRIMÉ - on n'a pas besoin de barres vertes supplémentaires
  
  // SUPPRIMÉ - on utilise les barres existantes en haut
  
  showDamageText(target, damage, isBlocked = false) {
    const color = isBlocked ? '#ffff00' : '#ff0000';
    const text = isBlocked ? `-${damage} (BLOCKED)` : `-${damage}`;
    const damageText = this.add.text(
      target.sprite.x,
      target.sprite.y - 80,
      text,
      { fontSize: '20px', color: color, fontStyle: 'bold' }
    ).setOrigin(0.5);
    
    this.tweens.add({
      targets: damageText,
      y: damageText.y - 30,
      alpha: 0,
      duration: 1000,
      onComplete: () => damageText.destroy()
    });
  }

  setSpineAnim(spineObj, name, loop=false) {
    if (!spineObj || !spineObj.animationState) return;
    
    try {
      // Get available animations
      const availableAnims = spineObj.skeleton?.data?.animations?.map(a => a.name) || [];
      
      // Detect character type based on available animations
      const isSpineboy = availableAnims.includes('idle') && availableAnims.includes('shoot');
      const isRaptor = availableAnims.includes('roar') && !availableAnims.includes('idle');
      
      let actualAnim = name;
      let animSpeed = 1.0;
      
      if (isSpineboy) {
        // Spineboy animations mapping (based on actual spineboy-pro.json)
        switch(name) {
          case 'idle': 
            actualAnim = 'idle';
            break;
          case 'walk': 
            actualAnim = 'walk';
            break;
          case 'run': 
            actualAnim = 'run';
            break;
          case 'hit':
          case 'attack':
            actualAnim = 'shoot'; // Spineboy uses shoot for attack
            break;
          case 'death': 
            actualAnim = 'death';
            break;
          case 'evade':
          case 'dodge':
            actualAnim = 'jump'; // Use jump for evasion
            break;
          case 'block':
            actualAnim = 'idle'; // No block animation
            break;
          default:
            actualAnim = availableAnims.includes(name) ? name : 'idle';
        }
      } else if (isRaptor) {
        // Raptor animations mapping 
        switch(name) {
          case 'idle':
            actualAnim = 'walk';
            animSpeed = 0.3; // Slow walk for idle
            break;
          case 'walk':
            actualAnim = 'walk';
            break;
          case 'run':
            actualAnim = 'walk';
            animSpeed = 2.0; // Fast walk for run
            break;
          case 'hit':
          case 'attack':
            actualAnim = 'roar';
            break;
          case 'death':
          case 'roar-long':
            actualAnim = availableAnims.includes('roar-long') ? 'roar-long' : 'roar';
            break;
          default:
            actualAnim = 'walk';
        }
      } else {
        // Default mapping for unknown Spine models
        actualAnim = availableAnims.includes(name) ? name : 
                    availableAnims.includes('idle') ? 'idle' :
                    availableAnims.includes('walk') ? 'walk' : 
                    availableAnims[0] || 'idle';
      }
      
      // Verify animation exists
      if (!availableAnims.includes(actualAnim)) {
        console.warn(`Animation '${actualAnim}' not found for ${name}, using fallback`);
        actualAnim = availableAnims[0] || 'idle';
      }
      
      // Set the animation
      spineObj.animationState.setAnimation(0, actualAnim, loop);
      spineObj.animationState.timeScale = animSpeed;
      
    } catch(error) {
      console.error('Animation error:', error);
      // Safe fallback
      try {
        const fallback = spineObj.skeleton?.data?.animations?.[0]?.name || 'idle';
        spineObj.animationState.setAnimation(0, fallback, loop);
        spineObj.animationState.timeScale = 1.0;
      } catch(e) {
        console.error('Could not set any animation');
      }
    }
  }
  
  _trackStart(name, detail) {
    try {
      if (!this._debug) this._debug = { pending: new Map(), nextId: 1 };
      const id = this._debug.nextId++;
      const rec = { id, name, detail, step: this._currentStepIndex, t: Date.now() };
      this._debug.pending.set(id, rec);
      if (this.debugAnims) console.log(`[Start:${name}] #${id} step=${rec.step} detail=`, detail);
      return id;
    } catch (_) { return 0; }
  }
  _trackEnd(id, outcome = 'ok') {
    try {
      const rec = this._debug?.pending?.get(id);
      if (rec) {
        this._debug.pending.delete(id);
        if (this.debugAnims) console.log(`[End:${rec.name}] #${id} step=${rec.step} outcome=${outcome} dt=${Date.now() - rec.t}ms`);
      }
    } catch (_) {}
  }

  // Anim helpers
  playIdle(f) {
    if (!f.isDead) { // Ne pas jouer idle si le personnage est mort
      this.setSpineAnim(f.sprite, 'idle', true);
    }
  }
  playWalk(f) {
    if (!f.isDead) {
      this.setSpineAnim(f.sprite, 'walk', true);
    }
  }
  playAttack(f) {
    if (!f.isDead) {
      // Utiliser idle pour l'attaque
      this.setSpineAnim(f.sprite, 'idle', false);
    }
  }
  playDeath(f) { 
    // Marquer qu'on a déjà joué l'animation de mort
    f.deathAnimPlayed = true;
    f.isDead = true; // Empêcher toute autre animation
    
    // Armes supprimées - pas d'animation de chute d'arme
    
    // Adapter l'ombre pour un personnage allongé
    if (f.shadow) {
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
    if (f.true) {
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
    // Return a promise so callers can await exact completion
    if (!f || !f.sprite) return Promise.resolve();
    const __id = this._trackStart('dodge', `${f?.stats?.name || f.side || 'fighter'}`);
    if (this._recoveryActive || this._cancelAnims || (this._cancelUntilTs && Date.now() < this._cancelUntilTs) || this.stopCombat || this.combatOver) { this._trackEnd(__id, 'bail'); return Promise.resolve(); }
    const dodgeDistance = f.side === 'left' ? -80 : 80;
    this.setSpineAnim(f.sprite, 'idle', true);
    
    const duration = 150;
    const ease = 'Back.easeOut';
    
    const p1 = new Promise(res => {
      let done = false; let fb; let winFb;
      const onDone = () => { if (done) return; done = true; if (fb && fb.remove) fb.remove(false); if (winFb && typeof window!== 'undefined' && window.clearTimeout) window.clearTimeout(winFb); this.playIdle(f); this._trackEnd(__id, 'ok'); res(); };
      this.tweens.add({ targets: f.sprite, x: f.sprite.x + dodgeDistance, duration, ease, yoyo: true, onComplete: onDone, onStop: onDone });
      const ms = Math.max(60, duration * 2 + 120); // yoyo twice plus buffer
      fb = this.time.delayedCall(ms, onDone);
      if (typeof window !== 'undefined' && window.setTimeout) winFb = window.setTimeout(onDone, Math.ceil(ms * 1.5));
    });
    
    const p2 = f.shadow ? new Promise(res => {
      let done = false; let fb; let winFb;
      const onDone = () => { if (done) return; done = true; if (fb && fb.remove) fb.remove(false); if (winFb && typeof window!== 'undefined' && window.clearTimeout) window.clearTimeout(winFb); res(); };
      this.tweens.add({ targets: f.shadow, x: f.shadow.x + dodgeDistance, duration, ease, yoyo: true, onComplete: onDone, onStop: onDone });
      const ms = Math.max(60, duration * 2 + 120);
      fb = this.time.delayedCall(ms, onDone);
      if (typeof window !== 'undefined' && window.setTimeout) winFb = window.setTimeout(onDone, Math.ceil(ms * 1.5));
    }) : Promise.resolve();
    
    // Visual effect (non-blocking)
    this.tweens.add({ targets: f.sprite, alpha: 0.6, duration: 100, yoyo: true });
    
    return Promise.all([p1, p2]);
  }
  playBlock(f) { 
    // Blocage avec animation Phaser : se protéger avec les bras
    
    // Garder en idle/aim mais avec mouvement de protection
    this.setSpineAnim(f.sprite, 'aim', false);
    
    // Petit recul de blocage
    const blockRecoil = f.side === 'left' ? -20 : 20;
    
    this.tweens.add({ 
      targets: f.sprite, 
      x: f.sprite.x + blockRecoil,
      scaleY: Math.abs(f.sprite.scaleY) * 0.9, // Se baisser légèrement
      duration: 100, 
      yoyo: true, 
      ease: 'Power2.Out',
      onComplete: () => this.playIdle(f)
    });
    
    // L'ombre suit
    this.tweens.add({ 
      targets: f.shadow, 
      x: f.shadow.x + blockRecoil,
      duration: 100, 
      yoyo: true
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
    if (this._recoveryActive || this._cancelAnims || (this._cancelUntilTs && Date.now() < this._cancelUntilTs) || this.stopCombat || this.combatOver) { if (this.debugAnims) console.log('[Bail] hitStop'); return; }
    const __id = this._trackStart('hitStop', `${slow},${ms}`);
    const prevTime = this.time.timeScale; const prevTween = this.tweens.timeScale;
    this.time.timeScale = slow; this.tweens.timeScale = slow;
    const fighters = [this.fighter1, this.fighter2].filter(Boolean);
    const prevAnim = fighters.map(f => f.sprite?.animationState?.timeScale ?? 1);
    fighters.forEach(f => { if (f.sprite?.animationState) f.sprite.animationState.timeScale = slow; });
    await new Promise(res => {
      let done = false;
      let evt; let winId;
      const finish = () => { if (done) return; done = true; if (evt && evt.remove) evt.remove(false); if (winId && typeof window !== 'undefined' && window.clearTimeout) window.clearTimeout(winId); this._trackEnd(__id, 'ok'); res(); };
      evt = this.time.delayedCall(ms, finish);
      if (typeof window !== 'undefined' && window.setTimeout) {
        winId = window.setTimeout(finish, Math.ceil(ms * 1.5));
      }
    });
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

  // Fonction petAttack supprimée - pets supprimés
  
  // Fonction animateWeaponAttack supprimée - utilisation des animations Spine uniquement
  
  // Fonction createWeaponShape supprimée - utilisation des animations Spine uniquement
  
  // Fonction createWeaponSprites supprimée - utilisation des animations Spine uniquement
  
  sleep(ms) {
    if (this._recoveryActive || this._cancelAnims || (this._cancelUntilTs && Date.now() < this._cancelUntilTs) || this.stopCombat || this.combatOver) { if (this.debugAnims) console.log('[Bail] sleep'); return Promise.resolve(); }
    const phaserMs = Math.max(30, ms * 0.3);
    const __id = this._trackStart('sleep', `${ms}ms`);
    return new Promise(res => {
      let done = false;
      let evt; let winId;
      const finish = () => { if (done) return; done = true; if (evt && evt.remove) evt.remove(false); if (winId && typeof window !== 'undefined' && window.clearTimeout) window.clearTimeout(winId); this._trackEnd(__id, 'ok'); res(); };
      evt = this.time.delayedCall(phaserMs, finish);
      if (typeof window !== 'undefined' && window.setTimeout) {
        winId = window.setTimeout(finish, Math.ceil(phaserMs * 1.5));
      }
    });
  } // Réduire encore plus les délais
  killFighterTweens(f) { this.tweens.killTweensOf(f.sprite); if (f.shadow) this.tweens.killTweensOf(f.shadow); }
  moveFighterTo(f, x, y, duration, ease='Linear') {
    if (this._recoveryActive || this._cancelAnims || (this._cancelUntilTs && Date.now() < this._cancelUntilTs) || this.stopCombat || this.combatOver) { if (this.debugAnims) console.log('[Bail] moveFighterTo'); return Promise.resolve(); }
    this.killFighterTweens(f);
    // Utiliser l'échelle de base stockée pour ce personnage spécifique
    const fighterBaseScale = f.sprite.baseScale || Math.abs(f.sprite.scaleX / this.getFighterScale(f.sprite.y));
    const scaleSign = f.sprite.scaleX < 0 ? -1 : 1;
    const __id1 = this._trackStart('moveTo.sprite', `${f?.stats?.name || 'fighter'} -> (${x},${y}) dur=${duration}`);
    
    // Ensure promise resolves on complete OR stop, with a fallback timer
    const p1 = new Promise(res => {
      let done = false;
      let fallback1; let winFallback1;
      const onDone = () => { if (done) return; done = true; if (fallback1 && fallback1.remove) fallback1.remove(false); if (winFallback1 && typeof window !== 'undefined' && window.clearTimeout) window.clearTimeout(winFallback1); this._trackEnd(__id1, 'ok'); res(); };
      const tween1 = this.tweens.add({ 
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
          
          // Armes et pets supprimés - utilisation des animations Spine uniquement
        },
        onComplete: onDone,
        onStop: onDone
      });
      // Phaser fallback in case tween is killed without callbacks
      const fb1Ms = Math.max(50, duration + 250);
      fallback1 = this.time.delayedCall(fb1Ms, onDone);
      if (typeof window !== 'undefined' && window.setTimeout) {
        winFallback1 = window.setTimeout(onDone, Math.ceil(fb1Ms * 1.5));
      }
    });
    
    const sScale = this.getShadowScale(y);
    // Décalage selon le côté et le type de personnage (inversé)
    const isRaptor = f.false;
    const shadowXOffset = f.side === 'left' ? (isRaptor ? 10 : 2) : (isRaptor ? -10 : -2);
    // Adapter l'échelle selon le type de personnage
    const shadowScaleX = sScale * (isRaptor ? 1.6 : 1.0); // Plus large pour le raptor
    const shadowScaleY = sScale * (isRaptor ? 0.48 : 0.4); // Plus épais pour Spineboy aussi
    const __id2 = f.shadow ? this._trackStart('moveTo.shadow', `${f?.stats?.name || 'fighter'} -> (${x},${y}) dur=${duration}`) : 0;
    const p2 = f.shadow ? new Promise(res => {
      let done = false;
      let fallback2; let winFallback2;
      const onDone = () => { if (done) return; done = true; if (fallback2 && fallback2.remove) fallback2.remove(false); if (winFallback2 && typeof window !== 'undefined' && window.clearTimeout) window.clearTimeout(winFallback2); if (__id2) this._trackEnd(__id2, 'ok'); res(); };
      const tween2 = this.tweens.add({ 
        targets: f.shadow, 
        x: x + shadowXOffset, 
        y: y + this.getShadowOffset(y), 
        scaleX: shadowScaleX,
        scaleY: shadowScaleY,
        duration, 
        ease, 
        onComplete: onDone,
        onStop: onDone
      });
      // Fallback timer for shadow tween as well
      const fb2Ms = Math.max(50, duration + 250);
      fallback2 = this.time.delayedCall(fb2Ms, onDone);
      if (typeof window !== 'undefined' && window.setTimeout) {
        winFallback2 = window.setTimeout(onDone, Math.ceil(fb2Ms * 1.5));
      }
    }) : Promise.resolve();
    
    return Promise.all([p1, p2]);
  }
  estimateHalfWidth(f) {
    const sx = Math.abs(f.sprite.scaleX || 1);
    return Math.max(24, 100 * sx);
  }
  getContactGap(attacker, target, margin=12) {
    const halfA = this.estimateHalfWidth(attacker);
    const halfT = this.estimateHalfWidth(target);
    // Distance normale sans bonus raptor
    return halfA + halfT + margin;
  }

  async executeTurn() {
    if (this.combatOver) return;
    if (this.turnInProgress) return;
    
    // Vérifier si un combattant est déjà mort
    if (this.fighter1.stats.health <= 0 || this.fighter2.stats.health <= 0) {
      console.log('Combat should be over - a fighter has 0 HP');
      this.combatOver = true;
      // Déterminer qui est mort et qui a gagné
      const winner = this.fighter1.stats.health > 0 ? this.fighter1 : this.fighter2;
      const loser = this.fighter1.stats.health <= 0 ? this.fighter1 : this.fighter2;
      
      // Animation de fin
      if (loser && loser.sprite && !loser.deathAnimPlayed) {
        const isRaptor = loser.false;
        if (isRaptor) {
          this.setSpineAnim(loser.sprite, 'roar-long', false);
          this.tweens.add({
            targets: loser.sprite,
            y: loser.sprite.y + 50,
            alpha: 0.5,
            duration: 800,
            ease: 'Power2'
          });
        } else {
          this.setSpineAnim(loser.sprite, 'death', false);
        }
        loser.deathAnimPlayed = true;
      }
      
      this.showWinner(winner, loser);
      return;
    }
    
    this.turnInProgress = true;

    // Turn-level watchdog to avoid stalls
    const turnTimeoutMs = this.turnTimeoutMs || 12000; // default 12s per turn
    let turnTimeoutEvent;
    let turnFallbackId;
    const turnTimeoutPromise = new Promise(resolve => {
      turnTimeoutEvent = this.time.delayedCall(turnTimeoutMs, () => resolve('timeout'));
      // Fallback using window timer in case Phaser's clock stalls
      if (typeof window !== 'undefined' && window.setTimeout) {
        turnFallbackId = window.setTimeout(() => resolve('timeout-window'), Math.ceil(turnTimeoutMs * 1.25));
      }
    });

    try {
      const doTurn = async () => {
        let result;
        try {
          result = this.engine.executeTurn();
        } catch (e) {
          console.error('Combat error:', e);
          this.turnInProgress = false;
          // Schedule next turn instead of recursion
          this.time.delayedCall(60, () => this.executeTurn()); // Plus rapide
          return;
        }

        if (!result) { 
          this.turnInProgress = false; 
          // Schedule next turn instead of recursion
          this.time.delayedCall(70, () => this.executeTurn()); // Plus rapide 
          return; 
        }
        
        const attacker = result.attacker; 
        const target = result.target;
        
        // Vérifier si le combat est terminé AVANT d'animer
        if (result.gameOver && result.damage === 0 && !result.hit) {
          // C'est un cas où le personnage était déjà mort avant de pouvoir attaquer
          console.log('Fighter was already dead, skipping attack animation');
          this.combatOver = true;
          this.updateUI();
          
          // Animation de victoire/défaite
          const loser = result.loser;
          const winner = result.winner;
          
          if (loser && loser.sprite && !loser.deathAnimPlayed) {
            const isRaptor = loser.false;
            if (isRaptor) {
              this.setSpineAnim(loser.sprite, 'roar-long', false);
              this.tweens.add({
                targets: loser.sprite,
                y: loser.sprite.y + 50,
                alpha: 0.5,
                duration: 800,
                ease: 'Power2'
              });
            } else {
              this.setSpineAnim(loser.sprite, 'death', false);
            }
            loser.deathAnimPlayed = true;
          }
          
          // Pas d'animation de victoire - le gagnant reste en idle
          
          this.showWinner(winner, loser);
          this.turnInProgress = false;
          return;
        }

        if (result.type === 'attack' || result.type === 'multi_attack' || result.type === 'counter') {
          // Affichage clair de l'action avec l'arme utilisée
          const weaponName = result.bareHands ? ' à mains nues' : (attacker.weaponType ? ` avec ${attacker.weaponType}` : ' à mains nues');
          this.appendLog(`${attacker.stats.name} attaque${weaponName} ${target.stats.name}${result.type==='multi_attack'?' (combo)':''}${result.critical?' [CRIT]':''}${result.hit?` et inflige ${result.damage} dégâts`:" mais rate"}`);

          const contactGap = this.getContactGap(attacker, target, 14);
          // Pas de décalage Y - reste sur la même ligne horizontale
          const contactY = target.sprite.y;
          const attackX = target.sprite.x + (attacker.side === 'left' ? -contactGap : contactGap);
          const distance = Math.abs(attackX - attacker.sprite.x);
          // Vitesse LaBrute officielle : rapide comme l'éclair
          const LABRUTE_SPEED = 1500; // pixels/seconde (vitesse d'attaque)
          const runDuration = Math.max(80, (distance / LABRUTE_SPEED) * 1000);

          this.playWalk(attacker);
          
          // Animations d'armes supprimées - utilisation des animations Spine uniquement
          
          await this.moveFighterTo(attacker, attackX, contactY, runDuration, 'Linear');
          
          // Mettre l'attaquant au premier plan (devant la cible)
          const depthBonus = attacker.false ? 50 : 10;
          attacker.sprite.setDepth(target.sprite.depth + depthBonus);
          if (attacker.shadow) attacker.shadow.setDepth(attacker.sprite.depth - 1);
          // Armes supprimées
          
          // Animation d'attaque
          this.playAttack(attacker);

          if (result.hit && result.damage > 0) {
            // Debug log pour vérifier les dégâts
            console.log(`HIT CONFIRMED: ${attacker.stats.name} -> ${target.stats.name}: ${result.damage} dmg${result.bareHands ? ' (BARE HANDS)' : ''}`);
            console.log(`Target HP before hit: ${target.stats.health}/${target.stats.maxHealth}`);
            
            // Affichage des dégâts au-dessus du personnage
            this.showDamageText(target, result.damage, result.critical);
            
            // Mise à jour des HP avec animation
            this.updateFighterHP(target);
            
            console.log(`Target HP after update: ${target.stats.health}/${target.stats.maxHealth}`);
            
            // Animations visuelles simultanées
            this.playHit(target);
            this.flashSpine(target.sprite);
            
            try {
              const old = { ...target.sprite.skeleton.color };
              target.sprite.skeleton.color.set(1,0.4,0.4,1);
              this.time.delayedCall(120,()=> target.sprite.skeleton.color.set(old.r,old.g,old.b,old.a));
            } catch(_) {}

            this.shakeTarget(target);
            // Shake immédiat (armes supprimées)
            this.shakeMedium();
            const g2 = this.add.graphics();
            g2.fillStyle(0xff2a2a, 0.45);
            g2.fillCircle(target.sprite.x + (target.side==='left'?-5:5), target.sprite.y - 46, 6);
            this.tweens.add({targets:g2, alpha:0, scale:2.2, duration:320, onComplete:()=>g2.destroy()});

            this.showDamageNumber(target, result.damage, !!result.critical);
            
            // IMPORTANT: Mettre à jour la barre de vie
            this.updateFighterHP(target);
            
            // Vérifier si mort
            if (target.stats.health <= 0) {
              this.playDeath(target);
            }
          } else if (result.type !== 'dodge') {
            this.showMissEffect(target);
            this.playEvadeTick(target);
          }

          // Attendre que l'animation d'arme se termine
          await this.sleep(120); // Plus rapide
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
          this.playWalk(attacker);
          await this.moveFighterTo(attacker, attackX, contactY, blockDuration, 'Linear');
          
          // Mettre l'attaquant au premier plan
          const depthBonus = attacker.false ? 50 : 10;
          attacker.sprite.setDepth(target.sprite.depth + depthBonus);
          if (attacker.shadow) attacker.shadow.setDepth(attacker.sprite.depth - 1);
          // Armes supprimées
          
          // Animation d'attaque bloquée
          this.playAttack(attacker);
          
          // La cible BLOQUE visiblement
          // Mise à jour immédiate des HP de la cible
          this.updateFighterHP(target);
          
          this.playBlock(target);
          this.showBlockIndicator(target);
          
          // Armes supprimées - blocage avec animations Spine uniquement
          
          await this.sleep(100); // Plus rapide
          
          // L'attaquant retourne à sa position
          await this.returnToPosition(attacker);
          
          // Vérifier si l'attaquant est mort
          if (attacker.stats.health <= 0 && !attacker.deathAnimPlayed) {
            this.playDeath(attacker);
          }
          
          // Rétablir l'ordre de profondeur après un délai pour laisser voir l'attaque
          this.time.delayedCall(300, () => this.updateDepthOrdering());
          
          // Commentaire APRÈS l'animation de blocage
          this.appendLog(`${target.stats.name} bloque l'attaque de ${attacker.stats.name}`);
        } else if (result.type === 'dodge') {
          // L'attaquant doit d'abord tenter d'attaquer
          const contactGap = this.getContactGap(attacker, target, 14);
          const attackX = target.sprite.x + (attacker.side === 'left' ? -contactGap : contactGap);
          const contactY = target.sprite.y;
          
          const dodgeDistance = Math.abs(attackX - attacker.sprite.x);
          const LABRUTE_SPEED = 1500; // pixels/seconde
          const dodgeDuration = Math.max(80, (dodgeDistance / LABRUTE_SPEED) * 1000);
          this.playWalk(attacker);
          await this.moveFighterTo(attacker, attackX, contactY, dodgeDuration, 'Linear');
          
          // Mettre l'attaquant au premier plan
          const depthBonus = attacker.false ? 50 : 10;
          attacker.sprite.setDepth(target.sprite.depth + depthBonus);
          if (attacker.shadow) attacker.shadow.setDepth(attacker.sprite.depth - 1);
          // Armes supprimées
          
          // Puis la cible esquive
          // Pas de mise à jour HP car pas de dégâts
          
          await this.playDodge(target);
          this.createDodgeIndicator(target);
          
          // L'attaquant retourne
          await this.sleep(75); // Plus rapide
          await this.returnToPosition(attacker);
          
          // Vérifier si l'attaquant est mort (peut arriver avec des contres ou autres)
          if (attacker.stats.health <= 0 && !attacker.deathAnimPlayed) {
            this.playDeath(attacker);
          }
          
          // Rétablir l'ordre de profondeur après un délai
          this.time.delayedCall(300, () => this.updateDepthOrdering());
          
          // Commentaire APRÈS l'animation d'esquive
          this.appendLog(`${target.stats.name} esquive l'attaque de ${attacker.stats.name}`);
        } else if (result.type === 'throw') {
          // Lancer d'armes simplifié - pas d'animation visuelle d'arme
          if (result.hit && result.damage > 0) {
            this.updateFighterHP(target);
            this.flashSpine(target.sprite);
            this.cameras.main.shake(150, 0.015);
            this.showDamageNumber(target, result.damage, !!result.critical);
          } else {
            this.showMissEffect(target);
          }

          // Commentaire du lancer
          const weaponThrown = attacker.weaponType || 'son arme';
          this.appendLog(`🎯 ${attacker.stats.name} LANCE ${weaponThrown} sur ${target.stats.name}${result.hit?` et inflige ${result.damage} dégâts`:" mais rate"}`);

          // Marquer que l'arme est lancée (pour la logique du moteur)
          attacker.weaponType = null;
          attacker.hasWeapon = false;
          attacker.weapon = null;
        } else if (result.type === 'special') {
          this.cameras.main.shake(130, 0.004);
          await this.sleep(70); // Plus rapide
          this.appendLog(`${attacker.stats.name} utilise une capacité spéciale !`);
        }

        // Vérifier si il y a une action de pet
        if (result.petAssist && result.petAssist.damage && result.petAssist.damage > 0) {
          console.log('PET ASSIST DETECTED WITH DAMAGE:', result.petAssist);
          
          // Si le combat est déjà terminé par le pet (depuis le moteur), gérer directement
          if (result.gameOver) {
            console.log('Combat ended by pet attack (from engine)');
            this.combatOver = true;
            this.updateUI();
            
            // Animations de fin
            const loser = result.loser || target;
            const winner = result.winner || attacker;
            
            if (loser && loser.sprite && !loser.deathAnimPlayed) {
              const isRaptor = loser.false;
              if (isRaptor) {
                this.setSpineAnim(loser.sprite, 'roar-long', false);
                this.tweens.add({
                  targets: loser.sprite,
                  y: loser.sprite.y + 50,
                  alpha: 0.5,
                  duration: 800,
                  ease: 'Power2'
                });
              } else {
                this.setSpineAnim(loser.sprite, 'death', false);
              }
              loser.deathAnimPlayed = true;
            }
            
            // Pas d'animation de victoire - le gagnant reste en idle
            
            this.showWinner(winner, loser);
            this.turnInProgress = false;
            return;
          }
          
          await this.sleep(200);
          
          // Pets supprimés - pas d'animation de pet
          if (result.petAssist && result.petAssist.damage > 0) {
            // Appliquer les dégâts du pet sans animation visuelle
            this.updateFighterHP(target);
            this.showDamageNumber(target, result.petAssist.damage, false);
            this.flashSpine(target.sprite);
            this.cameras.main.shake(100, 0.01);

            // Commentaire du pet
            this.appendLog(`🐾 Le ${result.petAssist.petType || 'pet'} de ${attacker.stats.name} attaque et inflige ${result.petAssist.damage} dégâts!`);

            // Vérifier si le combat est terminé
            if (target.stats.health <= 0) {
              this.combatOver = true;
              const isRaptor = target.false;
              if (isRaptor) {
                this.setSpineAnim(target.sprite, 'roar-long', false);
                this.tweens.add({
                  targets: target.sprite,
                  y: target.sprite.y + 50,
                  alpha: 0.5,
                  duration: 800,
                  ease: 'Power2'
                });
              } else {
                this.setSpineAnim(target.sprite, 'death', false);
              }
              target.deathAnimPlayed = true;

              this.time.delayedCall(500, () => {
                this.showWinner(attacker, target);
                this.turnInProgress = false;
              });
              return;
            }
          }
        }
        
        // Pas de mise à jour finale - tout est déjà synchronisé
        
        if (result.gameOver) {
          this.combatOver = true;
          
          // Forcer la mise à jour IMMÉDIATE et COMPLÈTE des barres
          // S'assurer que le perdant est bien à 0 HP
          if (result.loser) {
            // Les HP viennent du moteur uniquement
            this.updateFighterHP(result.loser, 0); // Forcer à 0
          }
          this.updateUI();
          
          // Attendre un peu avant les animations de fin
          await this.sleep(200);
          
          // Animation de défaite pour le perdant
          const loser = result.winner === this.fighter1 ? this.fighter2 : this.fighter1;
          const winner = result.winner === this.fighter1 ? this.fighter1 : this.fighter2;
          
          // Jouer l'animation de défaite pour le perdant (seulement si pas déjà fait)
          if (loser && loser.sprite && !loser.deathAnimPlayed) {
            // Pour Spineboy, utiliser death
            // Pour Raptor, utiliser une animation de défaite
            const isRaptor = loser.false;
            
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
            const isRaptorWinner = winner.false;
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
        // Schedule next turn instead of recursion
        this.time.delayedCall(160, () => this.executeTurn());
        return;
      };

      const raced = await Promise.race([doTurn(), turnTimeoutPromise]);
      if (raced === 'timeout' || raced === 'timeout-window') {
        console.warn(`⏰ Turn watchdog: exceeded ${turnTimeoutMs}ms. Forcing next turn.`);
        this.turnInProgress = false;
        if (!this.stopCombat && !this.combatOver) {
          this.time.delayedCall(50, () => this.executeTurn());
        }
      }
    } finally {
      if (turnTimeoutEvent && turnTimeoutEvent.remove) {
        turnTimeoutEvent.remove(false);
      }
      if (typeof window !== 'undefined' && window.clearTimeout && turnFallbackId) {
        window.clearTimeout(turnFallbackId);
      }
      // Ensure the flag is not left stuck
      this.turnInProgress = false;
    }
  }

  showDodgeChanceIndicator(defender, dodgeChance, dodgeAttempted, dodgeSuccess) {}
  showBlockChanceIndicator(defender, blockChance, blockAttempted, blockSuccess, hasStamina) {}

  getFighterScale(y) { return 1.0; } // Échelle fixe pour tous les personnages
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
    const isRaptor = fighter.false;
    if (isRaptor) {
      // Pour le Raptor, utiliser walk pour éviter le saut
      this.setSpineAnim(fighter.sprite, 'walk', true);
    } else {
      // Pour Spineboy, continuer avec run
      this.playWalk(fighter);
    }
    
    // Déplacer le personnage avec les armes/pets qui suivent
    await this.moveFighterTo(fighter, targetX, targetY, duration, 'Linear');
    
    this.playIdle(fighter);
    this.updateDepthOrdering();
  }

  // UI that adapts to canvas width
  createSimpleUI(W, H) {
    // UI basée sur LaBrute officiel
    const barWidth = 236;  // Largeur officielle LaBrute
    const barHeight = 20;
    const topMargin = 50;
    const sideMargin = 150;
    
    // Background container
    const bg = this.add.rectangle(W/2, 0, W, 100, 0x000000, 0.5).setOrigin(0.5, 0).setDepth(1000).setScrollFactor(0);

    // Barre gauche (verte)
    const f1bg = this.add.rectangle(sideMargin, topMargin, barWidth, barHeight, 0x222222).setOrigin(0, 0.5);
    const f1 = this.add.rectangle(sideMargin, topMargin, barWidth, barHeight, 0x00e676).setOrigin(0, 0.5).setStrokeStyle(2, 0x000000, 0.8);
    
    // Barre droite (rouge) - MÊME TECHNIQUE QUE LA GAUCHE
    const f2bg = this.add.rectangle(W - sideMargin, topMargin, barWidth, barHeight, 0x222222).setOrigin(1, 0.5);
    const f2 = this.add.rectangle(W - sideMargin, topMargin, barWidth, barHeight, 0xff5252).setOrigin(1, 0.5).setStrokeStyle(2, 0x000000, 0.8);
    f2.isRightBar = true; // Marquer comme barre droite
    
    const f1t = this.add.text(sideMargin, 16, this.fighter1.stats.name, { fontSize:'16px', color:'#fff' }).setOrigin(0,0.5);
    const f2t = this.add.text(W - sideMargin, 16, this.fighter2.stats.name, { fontSize:'16px', color:'#fff' }).setOrigin(1,0.5);
    this.logBox = this.add.rectangle(W/2, H - 20, W - sideMargin*0.8, 44, 0x000000, 0.35).setStrokeStyle(2, 0xffffff, 0.2);
    this.logText = this.add.text(sideMargin * 0.6, H - 36, '', { fontSize:'16px', color:'#fff' });
    return { f1, f2, f1bg, f2bg, f1t, f2t, w: barWidth };
  }
  appendLog(line) { if (this.logText) this.logText.setText(line); }
  
  showWinner(winner, loser) {
    console.log(`[SHOW WINNER] Called with winner=${winner.stats?.name || winner.name}, loser=${loser.stats?.name || loser.name}`);
    
    // Déterminer qui est VRAIMENT le gagnant selon le moteur
    let realWinner = winner;
    let realLoser = loser;
    
    if (this.engine && this.engine.winner) {
      // Le moteur a le nom du vrai gagnant
      const engineWinnerName = this.engine.winner;
      console.log(`[ENGINE] Real winner according to engine: ${engineWinnerName}`);
      
      // Trouver le bon fighter selon le nom
      if (this.fighter1.stats.name === engineWinnerName) {
        realWinner = this.fighter1;
        realLoser = this.fighter2;
      } else if (this.fighter2.stats.name === engineWinnerName) {
        realWinner = this.fighter2;
        realLoser = this.fighter1;
      }
      
      // Ne PAS modifier stats.health ici - on va utiliser les valeurs du moteur
      
      console.log(`[FINAL] Winner: ${realWinner.stats.name} (${realWinner.stats.health} HP)`);
      console.log(`[FINAL] Loser: ${realLoser.stats.name} (${realLoser.stats.health} HP)`);
    }
    
    // Synchroniser les HP finaux depuis le moteur
    if (this.engine && this.engine.fighters) {
      const engineWinner = this.engine.fighters.find(f => f.name === realWinner.stats.name);
      const engineLoser = this.engine.fighters.find(f => f.name === realLoser.stats.name);
      
      if (engineWinner) {
        realWinner.stats.health = Math.max(0, engineWinner.currentHp);
      }
      if (engineLoser) {
        realLoser.stats.health = 0; // Le perdant est forcément à 0
      }
    }
    
    const winnerHP = realWinner.stats.health;
    const loserHP = realLoser.stats.health;
    
    console.log(`[FINAL] ${realWinner.stats.name}: ${winnerHP} HP`);
    console.log(`[FINAL] ${realLoser.stats.name}: ${loserHP} HP`);
    
    // FORCER visuellement les barres immédiatement sans animation
    // Barre du gagnant
    const winnerIsF1 = (realWinner === this.fighter1);
    const winnerBar = winnerIsF1 ? this.ui.f1 : this.ui.f2;
    const loserBar = winnerIsF1 ? this.ui.f2 : this.ui.f1;
    
    // Calculer les largeurs finales basées sur les HP du moteur
    const winnerPercent = winnerHP / realWinner.stats.maxHealth;
    const clampedWinner = Math.max(0, Math.min(1, winnerPercent));
    
    // Barre du perdant basée sur ses vrais HP
    const loserPercent = loserHP / realLoser.stats.maxHealth;
    const clampedLoser = Math.max(0, Math.min(1, loserPercent));
    
    // Appliquer directement les échelles finales (scaleX) en fonction de l'origine de chaque barre
    // La barre gauche a origin (0, 0.5), la droite a origin (1, 0.5), ainsi la réduction se fait vers le centre
    winnerBar.scaleX = clampedWinner;
    loserBar.scaleX = clampedLoser;
    
    console.log(`[BARS] Winner bar (${realWinner.stats.name}): ${clampedWinner*100}% (${winnerHP}/${realWinner.stats.maxHealth})`);
    console.log(`[BARS] Loser bar (${realLoser.stats.name}): ${clampedLoser*100}% (${loserHP}/${realLoser.stats.maxHealth})`);
    
    // Utiliser les vrais noms
    const winnerName = realWinner.stats?.name || realWinner.name || 'Gagnant';
    const loserName = realLoser.stats?.name || realLoser.name || 'Perdant';
    
    this.appendLog(`🏆 ${winnerName} remporte le combat! ${loserName} est KO.`);
    
    // Ajouter un gros texte au centre
    const victoryText = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY - 100,
      `${winnerName} GAGNE!`,
      { 
        fontSize: '48px', 
        color: '#ffff00', 
        stroke: '#000000', 
        strokeThickness: 6,
        fontStyle: 'bold'
      }
    ).setOrigin(0.5).setDepth(3000);
    
    // Animation du texte
    this.tweens.add({
      targets: victoryText,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 500,
      yoyo: true,
      repeat: 2
    });
    
    // Bouton rematch après 3 secondes
    this.time.delayedCall(3000, () => {
      const rematchBtn = this.add.text(
        this.cameras.main.centerX,
        this.cameras.main.centerY + 50,
        '[CLIC pour REMATCH]',
        { fontSize: '24px', color: '#00ff00', stroke: '#000000', strokeThickness: 3 }
      ).setOrigin(0.5).setInteractive().setDepth(3001);
      
      rematchBtn.on('pointerdown', () => {
        console.log('=== REMATCH DÉCLENCHÉ ===');
        
        // Arrêter TOUT immédiatement
        this.combatOver = true;
        this.turnInProgress = false;
        this.stopCombat = true;
        
        // Arrêter toutes les animations et tweens
        this.tweens.killAll();
        this.time.removeAllEvents();
        
        // Nettoyer le moteur de combat
        if (this.engine) {
          this.engine = null;
        }
        
        // Nettoyer les sprites
        if (this.fighter1.sprite) {
          this.fighter1.sprite.destroy();
        }
        if (this.fighter2.sprite) {
          this.fighter2.sprite.destroy();
        }
        
        // Redémarrer proprement la scène
        console.log('Restarting scene...');
        this.scene.restart();
      });
    });
  }

  updateFighterHP(fighter) {
    // Basé sur le code officiel LaBrute (updateHp.ts)
    const isF1 = (fighter === this.fighter1);
    const healthBar = isF1 ? this.ui.f1 : this.ui.f2;
    const stats = fighter.stats;
    
    const healthPercent = Math.max(0, stats.health) / stats.maxHealth;
    const clamped = Math.max(0, Math.min(1, healthPercent));

    console.log('🔴 UPDATE HP BAR ════════════════════════════');
    console.log(`  Fighter: ${stats.name} (${isF1 ? 'LEFT' : 'RIGHT'})`);
    console.log(`  HP: ${stats.health}/${stats.maxHealth} = ${Math.round(clamped * 100)}%`);
    console.log(`  Target scaleX: ${clamped}`);
    console.log('═════════════════════════════════════════════');

    if (healthBar) {
      this.tweens.add({
        targets: healthBar,
        scaleX: clamped,
        duration: 250,  // Durée identique à LaBrute officiel
        ease: 'Power2',
        onComplete: () => {
          console.log(`  ✅ Bar animation complete: scaleX=${healthBar.scaleX}`);
        }
      });
    } else {
      console.log('  ❌ ERROR: Health bar not found!')
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
    // Vérifier que le sprite existe et a une position
    if (!target || !target.sprite || target.sprite.x === undefined || target.sprite.y === undefined) {
      console.warn('Cannot show damage text - invalid target position');
      return;
    }
    
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

  // =============================================================================
  // NEW MMO METHODS - Server-side Combat Integration
  // =============================================================================

  /**
   * Start fight using server-side combat engine
   */
  async startServerFight() {
    try {
      console.log('🎮 USING OFFICIAL LABRUTE ENGINE!');
      const fightResult = await this.officialAdapter.generateFight(
        this.fighter1,
        this.fighter2
      );
      if (!fightResult || !fightResult.steps) {
        throw new Error('No fight data received from official engine');
      }
      console.log(`✅ Official fight generated: ${fightResult.steps.length} steps`);
      // Build mapping from server indices to local fighters (server 0 -> right/fighter2, 1 -> left/fighter1)
      this._officialIndexMap = new Map([[0, this.fighter2], [1, this.fighter1]]);
      this.currentFightData = fightResult;
      for (let i = 0; i < fightResult.steps.length; i++) {
        if (this.stopCombat || this.combatOver) break;
        const step = fightResult.steps[i];
        await this.animateOfficialStep(step, i);
        // Small pacing delay between steps
        await this.delayAsync(250);
      }
      if (fightResult.winner != null && fightResult.loser != null) {
        this.handleFightEnd?.(fightResult);
      }
    } catch (error) {
      console.error('❌ Official engine failed, falling back to legacy:', error);
      // ... existing code ...
    }
  }

  // Helper: get fighter for official steps (server index 0/1)
  getOfficialFighter(index) {
    if (this._officialIndexMap && this._officialIndexMap.has(index)) return this._officialIndexMap.get(index);
    return this.getFighterByIndex(index);
  }

  /**
   * Animate a step from the OFFICIAL engine
   */
  async animateOfficialStep(step, index) {
    if (this.stopCombat || this.combatOver) return;
    
    // Get step action from step.a (LaBrute format)
    const stepAction = step.a || step.action || step.type;
    // Normalize common fields from short keys used by the official engine
    if (step.f !== undefined && step.fighter === undefined) step.fighter = step.f;
    if (step.t !== undefined && step.target === undefined) step.target = step.t;
    if (step.d !== undefined && step.damage === undefined) step.damage = step.d;
    if (step.c !== undefined && step.critical === undefined) step.critical = step.c;
    if (step.w !== undefined && step.winner === undefined) step.winner = step.w;
    if (step.l !== undefined && step.loser === undefined) step.loser = step.l;
    
    console.log(`🎬 Animating official step ${index}: ${stepAction}`, step);
    this.animationInProgress = true;
    this._currentStepIndex = index;
    if (this.debugAnims && this._debug?.pending) {
      console.log(`[Step ${index}] starting; pending helpers count=${this._debug.pending.size}`);
    }

    // Watchdog: ensure we never hang indefinitely on a single step
    const stepTimeoutMs = this.stepTimeoutMs || 8000; // default 8s per step
    let timeoutEvent;
    let timeoutId;
    try { timeoutEvent = this.time.delayedCall(stepTimeoutMs, () => {}, [], this); } catch(_) {}
    if (typeof window !== 'undefined' && window.setTimeout) {
      timeoutId = window.setTimeout(() => {}, stepTimeoutMs + 500);
    }

    try {
      const actionPromise = (async () => {
        // Route to appropriate animation based on action type
        switch (stepAction) {
          case 'arrive':
            await this.animateArrival(step);
            break;
          case 'move':
            await this.animateMove(step);
            break;
          case 'moveBack':
            await this.animateMoveBack(step);
            break;
          case 'attemptHit':
            await this.animateAttemptHit(step);
            break;
          case 'hit':
            await this.animateHit(step);
            break;
          case 'miss':
            await this.animateMiss(step);
            break;
          case 'evade':
            await this.animateEvade(step);
            break;
          case 'block':
            await this.animateBlock(step);
            break;
          case 'counter':
            await this.animateCounter(step);
            break;
          case 'throw':
            await this.animateThrow(step);
            break;
          case 'death':
            await this.animateDeath(step);
            break;
          case 'end':
            await this.animateEnd(step);
            break;
          default:
            console.log(`Unknown step action: ${stepAction}`);
        }
      })();

      // Remove undefined timeoutPromise race; just await action
      await actionPromise;
    } catch (error) {
      console.error(`Error animating step ${index}:`, error);
    } finally {
      if (timeoutEvent && timeoutEvent.remove) timeoutEvent.remove(false);
      if (timeoutId && typeof window !== 'undefined' && window.clearTimeout) window.clearTimeout(timeoutId);
    }

    this.animationInProgress = false;
  }

  /**
   * Forcefully recover from a stuck/timed-out animation step.
   * Kills all active tweens, clears timers, resets time scales and sets fighters to idle.
   * Ensures flags are reset so the fight flow continues.
   */
  async forceStepRecovery(step, index) {
    if (this._recoveryActive) return; // prevent reentrancy
    this._recoveryActive = true;
    try {
      // Signal all helpers to bail out immediately
      this._cancelAnims = true;
      console.warn(`[Recovery] Forcing recovery for step #${index} (${step?.action}). Killing tweens and clearing timers.`);
      if (this._debug?.pending) {
        console.warn('[Recovery] Aborting pending helpers:', Array.from(this._debug.pending.values()));
        try { for (const id of Array.from(this._debug.pending.keys())) this._trackEnd(id, 'recovery'); } catch(_) {}
      }

      // Reset any potential slow-motion/time scaling
      try { if (this.time) this.time.timeScale = 1; } catch(_) {}
      try { if (this.tweens) this.tweens.timeScale = 1; } catch(_) {}

      // Kill all ongoing tweens to avoid dangling onComplete handlers
      try { if (this.tweens && this.tweens.killAll) this.tweens.killAll(); } catch(_) {}

      // Clear any delayed calls that might be holding the step
      try { if (this.time && this.time.removeAllEvents) this.time.removeAllEvents(); } catch(_) {}

      // Put fighters back to a safe, non-blocking state
      try {
        const fighters = [this.fighter1, this.fighter2].filter(Boolean);
        fighters.forEach(f => {
          if (f && f.sprite) {
            // Best-effort: return to idle
            this.setSpineAnim(f.sprite, 'idle', true);
          }
        });
      } catch (e) {
        console.debug('[Recovery] Fighter reset error (non-fatal):', e);
      }

      // Clear step/animation flags
      this.animationInProgress = false;

      // Small yield to allow Phaser to settle
      await this.delayAsync(50);
    } catch (e) {
      console.error('[Recovery] Error during forced recovery:', e);
    } finally {
      this._recoveryActive = false;
      // Keep a short post-recovery quarantine window so any in-flight awaits bail immediately
      this._cancelUntilTs = Date.now() + 1500;
      this._cancelAnims = false;
    }
  }

  // Animation helper functions for official steps
  async animateArrival(step) {
    const fighter = this.getOfficialFighter(step.fighter);
    if (fighter) {
      console.log(`👋 ${fighter.stats.name} arrives`);
      this.setSpineAnim(fighter.sprite, 'idle', true);
    }
    await this.delayAsync(500);
  }

  async animateMove(step) {
    const fighter = this.getOfficialFighter(step.fighter);
    const target = this.getOfficialFighter(step.target);
    if (fighter && target) {
      console.log(`🏃 ${fighter.stats.name} moves to ${target.stats.name}`);
      this.setSpineAnim(fighter.sprite, 'walk');
      const gap = this.getContactGap(fighter, target);
      const targetX = target.sprite.x - gap;
      const targetY = target.sprite.y + Phaser.Math.Between(-20, 20);
      await this.moveFighterTo(fighter, targetX, targetY, 800);
      this.setSpineAnim(fighter.sprite, 'idle', true);
    }
  }

  async animateMoveBack(step) {
    const fighter = this.getOfficialFighter(step.fighter);
    if (fighter) {
      console.log(`🔙 ${fighter.stats.name} moves back`);
      this.setSpineAnim(fighter.sprite, 'walk');
      const returnY = fighter.baseY + Phaser.Math.Between(-20, 20);
      await this.moveFighterTo(fighter, fighter.baseX, returnY, 600);
      this.setSpineAnim(fighter.sprite, 'idle', true);
    }
  }

  async animateHit(step) {
    const attacker = this.getOfficialFighter(step.fighter);
    const defender = this.getOfficialFighter(step.target);
    if (attacker && defender) {
      // Ensure contact before hit
      const dist = Phaser.Math.Distance.Between(attacker.sprite.x, attacker.sprite.y, defender.sprite.x, defender.sprite.y);
      const gap = this.getContactGap(attacker, defender);
      if (dist > gap + 5) {
        await this.animateMove({ fighter: step.fighter, target: step.target });
      }
      console.log(`👊 ${attacker.stats.name} hits ${defender.stats.name} for ${step.damage ?? 0} damage`);
      this.setSpineAnim(attacker.sprite, 'attack');
      await this.delayAsync(220);
      this.setSpineAnim(defender.sprite, 'hit');
      // Sync HP from server if provided, otherwise apply damage
      if (step.targetHP != null) {
        defender.stats.health = Math.max(0, step.targetHP);
      } else if (step.damage > 0) {
        defender.stats.health = Math.max(0, defender.stats.health - step.damage);
      }
      if (step.fighterHP != null) {
        attacker.stats.health = Math.max(0, step.fighterHP);
      }
      if (step.damage > 0) {
        this.showDamageText(defender, step.damage, step.critical);
      }
      this.updateFighterHP(defender);
      this.updateFighterHP(attacker);
      if ((step.damage ?? 0) > 20) {
        this.cameras.main.shake(220, 0.02);
      }
      await this.delayAsync(320);
      this.setSpineAnim(defender.sprite, 'idle', true);
    }
  }

  async animateMiss(step) {
    const attacker = this.getFighterByIndex(step.fighter);
    if (attacker) {
      console.log(`❌ ${attacker.stats.name} misses`);
      
      this.setSpineAnim(attacker.sprite, 'attack');
      await this.delayAsync(200);
      
      // Show "MISS" text
      this.showMissText(attacker.sprite.x, attacker.sprite.y - 30);
      await this.delayAsync(400);
    }
  }

  async animateEvade(step) {
    const evader = this.getFighterByIndex(step.fighter);
    if (evader) {
      console.log(`🤸 ${evader.stats.name} evades`);
      
      // Utiliser notre animation d'esquive avec recul Phaser et attendre la fin
      await this.playDodge(evader);
      this.showMissText(evader.sprite.x, evader.sprite.y - 30);
      
      // Petite pause pour lisibilité si nécessaire
      await this.delayAsync(120);
    }
  }

  async animateBlock(step) {
    const blocker = this.getFighterByIndex(step.fighter);
    if (blocker) {
      console.log(`🛡️ ${blocker.stats.name} blocks`);
      
      // Show block effect
      const blockText = this.add.text(
        blocker.sprite.x,
        blocker.sprite.y - 100,
        'BLOCK!',
        { fontSize: '24px', color: '#4444ff', stroke: '#000', strokeThickness: 3 }
      ).setOrigin(0.5).setDepth(2000);
      
      this.tweens.add({
        targets: blockText,
        y: blockText.y - 40,
        alpha: 0,
        duration: 800,
        ease: 'Power2',
        onComplete: () => blockText.destroy()
      });
      
      await this.delayAsync(500);
    }
  }

  async animateCounter(step) {
    const fighter = this.getFighterByIndex(step.fighter);
    const target = this.getFighterByIndex(step.target);
    
    if (fighter && target) {
      console.log(`⚡ ${fighter.stats.name} counter attacks for ${step.damage} damage`);
      
      // Quick counter animation
      this.setSpineAnim(fighter.sprite, 'attack');
      await this.delayAsync(150);
      
      // Apply counter damage
      if (step.damage > 0) {
        target.stats.health = Math.max(0, target.stats.health - step.damage);
        this.showDamageText(target, step.damage, false);
        this.updateFighterHP(target);  // Mettre à jour SEULEMENT la cible
      }
      
      await this.delayAsync(200);
      this.setSpineAnim(fighter.sprite, 'idle', true);
    }
  }

  async animateThrow(step) {
    const attacker = this.getFighterByIndex(step.fighter);
    const defender = this.getFighterByIndex(step.target);
    console.log(`🎯 Throw animation${step.weapon ? ' for weapon: ' + step.weapon : ''}`);

    if (this._recoveryActive || this._cancelAnims || this.stopCombat || this.combatOver) {
      return;
    }

    if (!attacker || !attacker.sprite || !defender || !defender.sprite) {
      await this.delayAsync(300);
      return;
    }

    // Play throw/attack animation
    this.setSpineAnim(attacker.sprite, 'attack');

    // Simple projectile visual (circle) traveling towards defender
    const startX = attacker.sprite.x;
    const startY = attacker.sprite.y - 70;
    const endX = defender.sprite.x + (attacker.side === 'left' ? -10 : 10);
    const endY = defender.sprite.y - 60;
    const proj = this.add.circle(startX, startY, 6, 0xffe066).setDepth(2500);

    // Duration based on distance with sane clamps
    const dx = endX - startX;
    const dy = endY - startY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const duration = Math.max(120, Math.min(450, (distance / 1400) * 1000)); // ~1400 px/s

    // Guaranteed-resolve tween with window fallback
    const __idProj = this._trackStart('throw.projectile', `d=${Math.round(distance)} dur=${Math.round(duration)}ms`);
    await new Promise(resolve => {
      let done = false;
      let winId; let evt;
      const finish = () => {
        if (done) return; done = true;
        try { proj.destroy(); } catch (_) {}
        if (evt && evt.remove) evt.remove(false);
        if (typeof window !== 'undefined' && window.clearTimeout && winId) {
          window.clearTimeout(winId);
        }
        this._trackEnd(__idProj, 'ok');
        resolve();
      };

      this.tweens.add({
        targets: proj,
        x: endX,
        y: endY,
        alpha: { from: 1, to: 0.6 },
        scale: { from: 1, to: 1.1 },
        rotation: 6.283,
        duration,
        ease: 'Linear',
        onComplete: finish,
        onStop: finish
      });

      // Phaser fallback in case tween is killed without callbacks
      const fbMs = Math.max(60, duration + 200);
      evt = this.time.delayedCall(fbMs, finish);
      if (typeof window !== 'undefined' && window.setTimeout) {
        winId = window.setTimeout(finish, Math.ceil(fbMs * 1.5));
      }
    });

    // Brief hit reaction for defender
    if (defender && defender.sprite) {
      const __idReact = this._trackStart('throw.react', defender.stats?.name || 'defender');
      this.setSpineAnim(defender.sprite, 'hit');
      await this.delayAsync(140);
      this.setSpineAnim(defender.sprite, 'idle', true);
      this._trackEnd(__idReact, 'ok');
    }

    const __idCd = this._trackStart('throw.cooldown', '60ms');
    await this.delayAsync(60);
    this._trackEnd(__idCd, 'ok');
  }

  async animateDeath(step) {
    const fighter = this.getFighterByIndex(step.fighter);
    if (fighter) {
      console.log(`💀 ${fighter.stats.name} dies`);
      
      this.setSpineAnim(fighter.sprite, 'death', false);
      if (fighter.sprite.tint !== undefined) {
        fighter.sprite.tint = 0x666666;
      }
      
      this.updateUI();
      await this.delayAsync(1000);
    }
  }

  async animateEnd(step) {
    console.log(`🏆 Fight ends! Winner: fighter ${step.winner}`);
    this.combatOver = true;
    const winner = this.getOfficialFighter(step.winner);
    const loser = this.getOfficialFighter(step.loser);
    if (winner) console.log(`👑 ${winner.stats.name} wins!`);
    await this.delayAsync(600);
    try {
      const txt = this.add.text(
        this.scale.width / 2,
        this.scale.height / 2,
        winner ? `${winner.stats.name} WINS!` : 'Fight Ended',
        { fontSize: '28px', color: '#fff' }
      );
      txt.setOrigin(0.5);
    } catch(_) {}
  }

  /**
   * Animate a single combat step received from server (LEGACY)
   */
  async animateStep(step, index) {
    if (this.stopCombat || this.combatOver) return;
    
    // SYSTÈME DE LOG COMPLET
    console.log('╔═══════════════════════════════════════════════════════╗');
    console.log(`║ 📊 STEP #${index} - Type: ${step.a}                     `);
    console.log('╠═══════════════════════════════════════════════════════╣');
    console.log('║ 📋 Step data:', JSON.stringify(step));
    console.log(`║ ❤️ Fighter 1 (${this.fighter1.stats.name}): ${this.fighter1.stats.health}/${this.fighter1.stats.maxHealth} HP`);
    console.log(`║ 💙 Fighter 2 (${this.fighter2.stats.name}): ${this.fighter2.stats.health}/${this.fighter2.stats.maxHealth} HP`);
    console.log(`║ 📍 F1 Position: x=${Math.round(this.fighter1.sprite?.x || 0)}, y=${Math.round(this.fighter1.sprite?.y || 0)}`);
    console.log(`║ 📍 F2 Position: x=${Math.round(this.fighter2.sprite?.x || 0)}, y=${Math.round(this.fighter2.sprite?.y || 0)}`);
    console.log('╚═══════════════════════════════════════════════════════╝');
    
    // Map numeric step types from server to string types
    const stepTypeMap = {
      2: 'arrive',     // Arrive
      3: 'move',       // Move  
      9: 'hit',        // Hit
      19: 'attack',    // AttemptHit (map to attack for now)
      20: 'block',     // Block
      21: 'evade',     // Evade
      22: 'sabotage',  // Sabotage
      24: 'death',     // Death
      26: 'end',       // End
      27: 'counter'    // Counter
    };
    
    // Convert numeric type to string if needed
    const stepType = typeof step.a === 'number' ? (stepTypeMap[step.a] || `unknown_${step.a}`) : step.a;
    
    console.log(`🎬 Animating step ${index}: ${stepType} (raw: ${step.a})`, step);
    this.animationInProgress = true;

    try {
      switch (stepType) {
        case 'arrive':
          await this.animateServerArrival(step);
          break;
        case 'move':
          await this.animateServerMove(step);
          break;
        case 'hit':
        case 'attack':
          await this.animateServerHit(step);
          break;
        case 'evade':
          await this.animateServerEvade(step);
          break;
        case 'block':
          await this.animateServerBlock(step);
          break;
        case 'counter':
          await this.animateServerHit(step); // Counter is like a hit
          break;
        case 'sabotage':
          await this.animateServerHit(step); // Sabotage animation like hit for now
          break;
        case 'death':
          await this.animateServerDeath(step);
          break;
        case 'end':
          await this.animateServerEnd(step);
          break;
        default:
          console.log(`⚠️ Unknown step type: ${stepType}`);
          await this.delayAsync(200); // Small delay for unknown steps
      }
    } catch (error) {
      console.error(`Error animating step ${index}:`, error);
    }

    this.animationInProgress = false;
  }

  /**
   * Animation methods for server steps
   */
  async animateServerArrival(step) {
    const fighter = this.getFighterByIndex(step.f);
    if (fighter && fighter.sprite) {
      // Make sure fighter is visible and in position
      fighter.sprite.setAlpha(1);
      this.setSpineAnim(fighter.sprite, 'idle', true);
      console.log(`👋 ${fighter.stats.name} arrives`);
    }
    await this.delayAsync(500);
  }

  async animateServerMove(step) {
    const fighter = this.getFighterByIndex(step.f);
    const target = this.getFighterByIndex(step.t);
    
    if (fighter && target) {
      console.log(`🏃 ${fighter.stats.name} moves to ${target.stats.name}`);
      
      // Move animation with FREE MOVEMENT (both X and Y)
      this.setSpineAnim(fighter.sprite, 'walk');
      
      // Calculate position with gap from target - STAY ON CORRECT SIDE
      const gap = this.getContactGap(fighter, target);
      const targetX = fighter.side === 'left' 
        ? Math.min(target.sprite.x - gap, target.sprite.x - 80)  // Stay left of target
        : Math.max(target.sprite.x + gap, target.sprite.x + 80); // Stay right of target
      
      // IMPORTANT: Move to target's Y position for realistic combat positioning
      const targetY = target.sprite.y + Phaser.Math.Between(-30, 30); // Small Y variation for natural movement
      
      // Use moveFighterTo instead of non-existent tweenFighter
      await this.moveFighterTo(fighter, 
        targetX, 
        targetY, // Now moving vertically too!
        400
      );
      
      this.setSpineAnim(fighter.sprite, 'idle', true);
    }
    await this.delayAsync(300);
  }

  async animateServerHit(step) {
    const attacker = this.getFighterByIndex(step.f);
    const defender = this.getFighterByIndex(step.t);
    
    console.log('🎯 ANIMATE SERVER HIT ════════════════════════');
    console.log(`  Attacker index: ${step.f}, Defender index: ${step.t}`);
    console.log(`  Damage: ${step.d}`);
    console.log(`  Attacker found: ${!!attacker}, has sprite: ${!!attacker?.sprite}`);
    console.log(`  Defender found: ${!!defender}, has sprite: ${!!defender?.sprite}`);
    
    if (attacker && defender && attacker.sprite && defender.sprite) {
      console.log(`  Attacker: ${attacker.stats.name} at (${Math.round(attacker.sprite.x)}, ${Math.round(attacker.sprite.y)})`);
      console.log(`  Defender: ${defender.stats.name} at (${Math.round(defender.sprite.x)}, ${Math.round(defender.sprite.y)})`);
      console.log('═════════════════════════════════════════════');
      
      // Move attacker closer with FREE VERTICAL MOVEMENT
      this.setSpineAnim(attacker.sprite, 'walk');
      const gap = this.getContactGap(attacker, defender, 20);
      
      // POSITIONNEMENT FACE À FACE : L'attaquant s'arrête juste avant le contact
      let targetX;
      if (attacker.side === 'left') {
        // Attaquant à gauche : s'arrêter à gauche du défenseur avec le gap
        targetX = defender.sprite.x - gap;
      } else {
        // Attaquant à droite : s'arrêter à droite du défenseur avec le gap
        targetX = defender.sprite.x + gap;
      }
      
      console.log(`  Moving attacker to targetX: ${targetX} (gap: ${gap})`);
      console.log(`  Attacker side: ${attacker.side}, Defender pos: ${defender.sprite.x}`);
      
      // IMPORTANT: Move to defender's Y position for proper combat alignment
      const targetY = defender.sprite.y + Phaser.Math.Between(-10, 10); // Small variation for natural combat
      
      await this.moveFighterTo(attacker, targetX, targetY, 300);
      
      // Attack animation
      this.setSpineAnim(attacker.sprite, 'attack');
      await this.delayAsync(200);
      
      // Hit effect and damage
      this.setSpineAnim(defender.sprite, 'hit');
      
      // CRITICAL: Update HP from server data properly
      console.log('💥 DAMAGE APPLICATION ════════════════════════');
      console.log(`  Step damage value: ${step.d}`);
      console.log(`  Damage defined: ${step.d !== undefined}`);
      console.log(`  Damage > 0: ${step.d > 0}`);
      
      if (step.d !== undefined && step.d > 0) {
        // Update defender's health
        const oldHealth = defender.stats.health;
        defender.stats.health = Math.max(0, oldHealth - step.d);
        
        console.log(`  ✅ APPLYING DAMAGE`);
        console.log(`  Old HP: ${oldHealth}`);
        console.log(`  Damage: ${step.d}`);
        console.log(`  New HP: ${defender.stats.health}`);
        console.log('═════════════════════════════════════════════');
        
        // Show damage text
        this.showDamageText(defender, step.d, step.c === 1);
        
        // Update ONLY the defender's HP bar (not both!)
        this.updateFighterHP(defender);
      } else {
        console.log(`  ❌ NO DAMAGE APPLIED (step.d = ${step.d})`);
        console.log('═════════════════════════════════════════════');
      }
      
      // Camera shake for big hits
      if (step.d > 20) {
        this.cameras.main.shake(200, 0.02);
      }
      
      // Move back to original position
      await this.delayAsync(200);
      this.setSpineAnim(attacker.sprite, 'walk');
      
      // Return to base position with some Y variation for dynamic movement
      const returnY = attacker.baseY + Phaser.Math.Between(-20, 20);
      await this.moveFighterTo(attacker, attacker.baseX, returnY, 300);
      this.setSpineAnim(attacker.sprite, 'idle', true);
      
      await this.delayAsync(200);
    }
  }

  async animateServerEvade(step) {
    const evader = this.getFighterByIndex(step.f);
    if (evader) {
      console.log(`🤸 ${evader.stats.name} evades`);
      
      // Utiliser notre animation d'esquive avec recul Phaser au lieu du jump Spine
      await this.playDodge(evader);
      
      // Show "MISS" text
      this.showMissText(evader.sprite.x, evader.sprite.y - 30);
      
      await this.delayAsync(120);  // Petite pause pour lisibilité
    }
  }

  async animateServerBlock(step) {
    const blocker = this.getFighterByIndex(step.f);
    if (blocker) {
      console.log(`🛡️ ${blocker.stats.name} blocks`);
      
      // Block animation (use idle with special effect)
      this.setSpineAnim(blocker.sprite, 'idle');
      
      // Show "BLOCK" text
      this.showBlockText(blocker.sprite.x, blocker.sprite.y - 30);
      
      await this.delayAsync(600);
    }
  }

  async animateServerDeath(step) {
    const fighter = this.getFighterByIndex(step.f);
    if (fighter && !fighter.deathAnimPlayed) {
      console.log(`💀 ${fighter.stats.name} dies`);
      
      fighter.deathAnimPlayed = true;
      fighter.stats.health = 0;
      
      this.setSpineAnim(fighter.sprite, 'death');
      
      // Death effects
      if (fighter.sprite.tint !== undefined) {
        fighter.sprite.tint = 0x666666; // Darken
      }
      
      this.updateUI();
      await this.delayAsync(1000);
    }
  }

  async animateServerEnd(step) {
    console.log(`🏆 Fight ends!`);
    this.combatOver = true;
    
    const winner = this.getFighterByIndex(step.w);
    const loser = this.getFighterByIndex(step.l);
    
    if (winner) {
      this.setSpineAnim(winner.sprite, 'idle', true);
      console.log(`👑 Winner: ${winner.stats.name}`);
    }
    
    await this.delayAsync(1000);
    this.showVictoryScreen(winner, loser);
  }

  /**
   * Handle fight completion
   */
  handleFightEnd(fightData) {
    console.log('🎉 Fight completed!', fightData);
    
    // Show final results
    this.time.delayedCall(2000, () => {
      if (window.showCombatResults) {
        window.showCombatResults({
          winner: fightData.fight.winner,
          loser: fightData.fight.loser,
          validated: true
        });
      }
    });
  }

  /**
   * Fallback to old local mode if server unavailable
   */
  fallbackToLocalMode() {
    console.warn('⚠️ Falling back to local combat mode');
    this.showErrorMessage('Server unavailable - Please start the server');
  }

  /**
   * Helper methods for MMO integration
   */
  getFighterByIndex(index) {
    return index === 0 ? this.fighter1 : this.fighter2;
  }

  delayAsync(ms) {
    if (this._recoveryActive || this._cancelAnims || (this._cancelUntilTs && Date.now() < this._cancelUntilTs) || this.stopCombat || this.combatOver) { if (this.debugAnims) console.log('[Bail] delayAsync'); return Promise.resolve(); }
    const phaserMs = Math.max(120, ms); // slower pacing
    const __id = this._trackStart('delay', `${ms}ms`);
    return new Promise(resolve => {
      let done = false;
      let evt; let winId;
      const finish = () => { if (done) return; done = true; if (evt && evt.remove) evt.remove(false); if (winId && typeof window !== 'undefined' && window.clearTimeout) window.clearTimeout(winId); this._trackEnd(__id, 'ok'); resolve(); };
      evt = this.time.delayedCall(phaserMs, finish);
      if (typeof window !== 'undefined' && window.setTimeout) {
        winId = window.setTimeout(finish, Math.ceil(phaserMs * 1.5));
      }
    });
  }

  showErrorMessage(message) {
    const errorText = this.add.text(
      this.scale.width / 2, 
      this.scale.height / 2,
      message,
      {
        fontSize: '24px',
        color: '#ff0000',
        fontFamily: 'Arial Black'
      }
    ).setOrigin(0.5).setDepth(1000);

    this.time.delayedCall(3000, () => errorText.destroy());
  }

  showMissText(x, y) {
    const missText = this.add.text(x, y, 'MISS', {
      fontSize: '32px',
      color: '#ffffff',
      fontFamily: 'Arial Black',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(999);

    this.tweens.add({
      targets: missText,
      y: missText.y - 60,
      alpha: 0,
      scale: 1.5,
      duration: 800,
      ease: 'Power2',
      onComplete: () => missText.destroy()
    });
  }

  showBlockText(x, y) {
    const blockText = this.add.text(x, y, 'BLOCK', {
      fontSize: '32px',
      color: '#4444ff',
      fontFamily: 'Arial Black',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(999);

    this.tweens.add({
      targets: blockText,
      y: blockText.y - 60,
      alpha: 0,
      scale: 1.3,
      duration: 800,
      ease: 'Power2',
      onComplete: () => blockText.destroy()
    });
  }

  // ... existing code ...
  // Replace local engine call with API fetch
  async startFight() {
    const response = await fetch('/api/fight/generate', {
      method: 'POST',
      body: JSON.stringify({ brute1: this.fighter1.id, brute2: this.fighter2.id })
    });
    const { steps, winner } = await response.json();
    this.playSteps(steps);
  }
  // Add playSteps to animate received steps
  playSteps(steps) {
    steps.forEach(step => {
      // Animate based on step.type (hit, skill, etc.)
    });
  }
  // ... existing code ...

  async animateAttemptHit(step) {
    // Small wind-up animation without applying damage
    const attacker = this.getFighterByIndex(step.fighter);
    const defender = this.getFighterByIndex(step.target);
    if (attacker && defender) {
      // Face target and play a quick pre-attack
      this.setSpineAnim(attacker.sprite, 'attack');
      await this.delayAsync(150);
      this.setSpineAnim(attacker.sprite, 'idle', true);
    }
  }
}

