import Phaser from 'phaser';
import { SpinePlugin } from '@esotericsoftware/spine-phaser';
import { BootScene } from './scenes/BootScene.js';
import { FightScene } from './scenes/FightScene.js';
import { SpineTestScene } from './scenes/SpineTestScene.js';
import { FightSceneSpine } from './scenes/FightSceneSpine.js';
import { HubScene } from './scenes/HubScene.js';
import { TrainingScene } from './scenes/TrainingScene.js';
import { TrainingInteractiveScene } from './scenes/TrainingInteractiveScene.js';
import { HubEnhancedScene } from './scenes/HubEnhancedScene.js';
import { HubSimpleScene } from './scenes/HubSimpleScene.js';
import { HubUltraScene } from './scenes/HubUltraScene.js';
import { TrainingSelectionScene } from './scenes/TrainingSelectionScene.js';
import { MeleeTrainingScene } from './scenes/MeleeTrainingScene.js';

const config = {
  type: Phaser.AUTO,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    parent: 'game-container',
    width: 1024,
    height: 768
  },
  backgroundColor: '#2d2419',
  plugins: {
    scene: [
      {
        key: 'SpinePlugin',
        plugin: SpinePlugin,
        mapping: 'spine'
      }
    ]
  },
  scene: [BootScene, SpineTestScene, FightSceneSpine, FightScene, HubScene, HubEnhancedScene, HubSimpleScene, HubUltraScene, TrainingScene, TrainingInteractiveScene, TrainingSelectionScene, MeleeTrainingScene]
};

new Phaser.Game(config);