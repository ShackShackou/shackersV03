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

    this.add.text(width / 2, 120, 'Création de Brute', { fontSize: '36px', color: '#ffffff' }).setOrigin(0.5);

    this.nameText = this.add.text(width / 2, 200, 'Nom: MaBrute', { fontSize: '22px', color: '#ffffaa' }).setOrigin(0.5).setInteractive({ useHandCursor: true }).on('pointerup', async () => {
      const val = window.prompt('Nom de ta brute:', 'MaBrute');
      if (val) this.nameText.setText('Nom: ' + val);
    });

    const genderText = this.add.text(width / 2, 240, 'Genre: male (cliquer pour changer)', { fontSize: '18px', color: '#ccccff' }).setOrigin(0.5).setInteractive({ useHandCursor: true }).on('pointerup', () => {
      this.gender = this.gender === 'male' ? 'female' : 'male';
      genderText.setText(`Genre: ${this.gender} (cliquer pour changer)`);
    });

    this.add.text(width / 2, 320, '[ Créer ma brute ]', { fontSize: '24px', color: '#00ff88' })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', async () => {
        await this.createBrute();
      });

    this.add.text(width / 2, 380, '[ Mes brutes ]', { fontSize: '20px', color: '#ffffff' })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => this.scene.start('MyBrutesScene'));
  }

  private async createBrute() {
    const token = localStorage.getItem('labrute_token');
    if (!token) {
      alert('Tu dois te connecter.');
      this.scene.start('LoginScene');
      return;
    }
    const name = this.nameText.text.replace(/^Nom:\s*/i, '');
    try {
      const res = await fetch(`${API_BASE}/brutes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name: name + Math.floor(Math.random()*100000), gender: this.gender }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Création échouée');
      alert('Brute créée: ' + data.name);
      this.scene.start('MyBrutesScene');
    } catch (e: any) {
      alert(e.message || String(e));
    }
  }
}
