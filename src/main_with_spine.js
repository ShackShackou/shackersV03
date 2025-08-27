// main_with_spine.js - Version avec support Spine
// Utilise ton code V00 + ajoute Spine

// Si tu utilises des imports, décommente ces lignes:
// import Phaser from 'phaser';
// import SpinePlugin from '@esotericsoftware/spine-phaser';

// Configuration Phaser avec Spine
const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: 1280,
    height: 720,
    backgroundColor: '#2a2a2a',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    // PLUGIN SPINE AJOUTÉ ICI
    plugins: {
        scene: [{
            key: 'SpinePlugin',
            plugin: window.SpinePlugin || SpinePlugin,
            mapping: 'spine'
        }]
    },
    // Ajoute tes scènes ici
    scene: []  // À remplir avec tes scènes de V00
};

// Si tu as des scènes dans game/ ou scenes/, ajoute-les à config.scene
// Exemple: config.scene = [MenuScene, ArenaScene, GameOverScene];

// Animation State Machine
const AnimationStateMachine = {
  states: {
    idle: { transitions: { run: 'run', attack: 'attack' } },
    run: { transitions: { attack: 'attack', idle: 'idle' } },
    // etc.
  },
  setState(spineObj, state, mixTime = 0.2) {
    spineObj.state.setAnimation(0, state, true);
    // Mix with previous
    spineObj.stateData.setMix(spineObj.animation.name, state, mixTime);
  }
};

// Dynamic attachments
function attachWeapon(spineObj, weaponType) {
  spineObj.skeleton.setAttachment('weapon_slot', weaponType);
}

// Spine pooling
const spinePool = [];
function getSpineFromPool() {
  return spinePool.pop() || new SpineGameObject();
}
// Texture atlases
this.textures.addAtlas('spineAtlas', 'assets/spine/atlas.png', 'assets/spine/atlas.json');
// GPU instancing: group spines
const spineGroup = this.add.group({ classType: SpineGameObject, maxSize: 50 });

const game = new Phaser.Game(config);
console.log('🎮 LaBrute V04 avec Spine - Basé sur V00');
