import Phaser from "phaser";
import Level from "./scenes/Level";
import Preload from "./scenes/Preload";
import LoginScene from "./scenes/LoginScene.ts";
import CharacterCreateScene from "./scenes/CharacterCreateScene.ts";
import MyShackersScene from "./scenes/MyShackersScene.ts";
import WaitingScene from "./scenes/WaitingScene.ts";
import { SpinePlugin } from '@esotericsoftware/spine-phaser';
// Fight scene implemented in JS
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { FightSceneSpine } from "./scenes/FightSceneSpine.js";

class Boot extends Phaser.Scene {

    constructor() {
        super("Boot");
    }

    preload() {
        this.load.pack("pack", "assets/preload-asset-pack.json");
    }

    create() {
       // Start with waiting scene
       this.scene.start("WaitingScene");
    }
}

window.addEventListener('load', function () {
    // Check if user is logged in
    const token = localStorage.getItem('labrute_token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }
    
    const game = new Phaser.Game({
        width: 1280,
        height: 720,
        backgroundColor: "#2f2f2f",
        parent: "game-container",
        scale: {
            mode: Phaser.Scale.FIT, // show entire game, may add letterbox
            autoCenter: Phaser.Scale.Center.CENTER_BOTH
        },
        plugins: {
            scene: [
                { key: 'SpinePlugin', plugin: SpinePlugin, mapping: 'spine' }
            ]
        },
        scene: [Boot, Preload, WaitingScene, CharacterCreateScene, MyShackersScene, FightSceneSpine, Level]
    });

    game.scene.start("Boot");
    
    // Expose game globally for external control
    (window as any).game = game;
});