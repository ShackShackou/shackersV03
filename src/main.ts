import Phaser from "phaser";
import Level from "./scenes/Level";
import Preload from "./scenes/Preload";
import LoginScene from "./scenes/LoginScene";
import CharacterCreateScene from "./scenes/CharacterCreateScene";
import MyBrutesScene from "./scenes/MyBrutesScene";
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
       this.scene.start("Preload");
    }
}

window.addEventListener('load', function () {
    
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
        scene: [Boot, Preload, LoginScene, CharacterCreateScene, MyBrutesScene, FightSceneSpine, Level]
    });

    game.scene.start("Boot");
});