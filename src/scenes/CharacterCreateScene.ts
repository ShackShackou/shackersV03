import Phaser from 'phaser';

const API_BASE = 'http://localhost:4000/api';

export default class CharacterCreateScene extends Phaser.Scene {
  constructor() {
    super('CharacterCreateScene');
  }

  private nameText!: Phaser.GameObjects.Text;
  private gender: 'male' | 'female' = 'male';

  create() {
    const { width } = this.scale;

    this.add.text(width / 2, 120, 'Create your SHACKER', { fontSize: '36px', color: '#ffffff' }).setOrigin(0.5);

    this.nameText = this.add.text(width / 2, 200, 'Name: MyShacker', { fontSize: '22px', color: '#ffffaa' }).setOrigin(0.5).setInteractive({ useHandCursor: true }).on('pointerup', async () => {
      const val = window.prompt('Name your SHACKER:', 'MyShacker');
      if (val) this.nameText.setText('Name: ' + val);
    });

    const genderText = this.add.text(width / 2, 240, 'Gender: male (click to change)', { fontSize: '18px', color: '#ccccff' }).setOrigin(0.5).setInteractive({ useHandCursor: true }).on('pointerup', () => {
      this.gender = this.gender === 'male' ? 'female' : 'male';
      genderText.setText(`Gender: ${this.gender} (click to change)`);
    });

    this.add.text(width / 2, 320, '[ Create my SHACKER ]', { fontSize: '24px', color: '#00ff88' })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', async () => {
        await this.createShacker();
      });

    this.add.text(width / 2, 380, '[ My SHACKERS ]', { fontSize: '20px', color: '#ffffff' })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => this.scene.start('MyShackersScene'));
  }

  private async createShacker() {
    const token = localStorage.getItem('labrute_token');
    if (!token) {
      alert('You must sign in.');
      this.scene.start('LoginScene');
      return;
    }
    const name = this.nameText.text.replace(/^Name:\s*/i, '');
    try {
      const res = await fetch(`${API_BASE}/shackers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name: name, gender: this.gender }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Creation failed');
      alert('SHACKER created: ' + data.name);
      this.scene.start('MyShackersScene');
    } catch (e: any) {
      alert(e.message || String(e));
    }
  }
}
