import Phaser from 'phaser';

const API_BASE = 'http://localhost:4000/api';

export default class LoginScene extends Phaser.Scene {
  constructor() {
    super('LoginScene');
  }

  create() {
    const { width, height } = this.scale;
    this.add.text(width / 2, 120, 'LaBrute Reborn', { fontSize: '42px', color: '#ffffff' }).setOrigin(0.5);
    this.add.text(width / 2, 170, 'Connexion requise', { fontSize: '20px', color: '#cccccc' }).setOrigin(0.5);

    const registerBtn = this.add.text(width / 2, 240, '[ Créer un compte ]', { fontSize: '20px', color: '#00ff88' })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', async () => {
        await this.handleRegister();
      });

    const loginBtn = this.add.text(width / 2, 280, '[ Se connecter ]', { fontSize: '20px', color: '#00ccff' })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', async () => {
        await this.handleLogin();
      });

    const continueBtn = this.add.text(width / 2, 340, '[ Continuer → Création de brute ]', { fontSize: '20px', color: '#ffffff' })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => {
        const token = localStorage.getItem('labrute_token');
        if (!token) {
          alert('Tu dois te connecter d\'abord.');
          return;
        }
        this.scene.start('CharacterCreateScene');
      });

    // Auto-redirect if already logged in
    const token = localStorage.getItem('labrute_token');
    if (token) {
      this.time.delayedCall(500, () => this.scene.start('CharacterCreateScene'));
    }
  }

  private async handleRegister() {
    const email = window.prompt('Email:');
    if (!email) return;
    const password = window.prompt('Mot de passe (min 6):') || '';
    const name = window.prompt('Pseudo:') || '';
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Register failed');
      localStorage.setItem('labrute_token', data.token);
      alert('Compte créé, connecté.');
    } catch (e: any) {
      alert(e.message || String(e));
    }
  }

  private async handleLogin() {
    const email = window.prompt('Email:');
    if (!email) return;
    const password = window.prompt('Mot de passe:') || '';
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Login failed');
      localStorage.setItem('labrute_token', data.token);
      alert('Connecté.');
    } catch (e: any) {
      alert(e.message || String(e));
    }
  }
}
