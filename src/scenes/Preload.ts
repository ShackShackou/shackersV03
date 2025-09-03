
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class Preload extends Phaser.Scene {

	constructor() {
		super("Preload");

		/* START-USER-CTR-CODE */
		// Write your code here.
		/* END-USER-CTR-CODE */
	}

    editorCreate(): void {
        // Simple loading UI (no external images)
        const progressBar = this.add.rectangle(512 - 128, 360, 256, 20);
        progressBar.setOrigin(0, 0);
        progressBar.isFilled = true;
        progressBar.fillColor = 0x666666;

        const progressBarBg = this.add.rectangle(512 - 128, 360, 256, 20);
        progressBarBg.setOrigin(0, 0);
        progressBarBg.isStroked = true;
        progressBarBg.strokeColor = 0x999999;

        const loadingText = this.add.text(512, 330, "Loading...", { color: "#e0e0e0", fontFamily: "arial", fontSize: "20px" }).setOrigin(0.5, 0);

        this.progressBar = progressBar as any;
        this.events.emit("scene-awake");
    }

	private progressBar!: Phaser.GameObjects.Rectangle;

	/* START-USER-CODE */

    preload() {
        this.editorCreate();
        // Optional pack removed: assets/asset-pack.json not used in this build
		const width = this.progressBar.width;
		this.load.on("progress", (value: number) => {
			this.progressBar.width = width * value;
		});
	}

	create() {
		const params = new URLSearchParams(location.search);
		const start = params.get("start");
		const fightId = params.get("fight");
		if (start) {
			console.log(`[Preload] Jump to ${start}`);
			this.scene.start(start);
			return;
		}

		// Direct replay mode: /?fight=ID (uses public GET on API)
		if (fightId) {
			const API_BASE = 'http://localhost:4000/api';
			fetch(`${API_BASE}/fights/${fightId}`)
				.then(async (res) => {
					if (!res.ok) throw new Error(`GET /fights/${fightId} failed (${res.status})`);
					const data = await res.json();
					if (!data || !Array.isArray(data.steps)) throw new Error('Missing steps');
					this.scene.start('FightSpine', { fighters: data.fighters || null, steps: data.steps });
				})
				.catch((e) => {
					console.warn('Replay fetch failed:', e);
					this.scene.start('LoginScene');
				});
			return;
		}

		// Default: always go to LoginScene
		this.scene.start('LoginScene');
	}

	/* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
