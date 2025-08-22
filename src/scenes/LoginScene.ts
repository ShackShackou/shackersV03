import Phaser from 'phaser';
import { LoginModal } from '../components/LoginModal';

const API_BASE = 'http://localhost:4000/api';

export default class LoginScene extends Phaser.Scene {
  private loginModal!: LoginModal;
  
  constructor() {
    super('LoginScene');
  }

  create() {
    const { width, height } = this.scale;
    
    // Create login modal
    this.loginModal = new LoginModal(this, async (email: string, password: string) => {
      if (password.includes('|REG|')) {
        const parts = password.split('|REG|');
        await this.handleRegister(email, parts[0], parts[1]);
      } else {
        await this.handleLogin(email, password);
      }
    });
    this.add.text(width / 2, 120, 'SHACKERS', { fontSize: '42px', color: '#ffffff' }).setOrigin(0.5);
    this.add.text(width / 2, 170, 'Login required', { fontSize: '20px', color: '#cccccc' }).setOrigin(0.5);

    const registerBtn = this.add.text(width / 2, 240, '[ Create account ]', { fontSize: '20px', color: '#00ff88' })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => {
        this.loginModal.show(true);
      });

    const loginBtn = this.add.text(width / 2, 280, '[ Sign in ]', { fontSize: '20px', color: '#00ccff' })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => {
        this.loginModal.show(false);
      });

    const continueBtn = this.add.text(width / 2, 340, '[ Continue → Create your SHACKER ]', { fontSize: '20px', color: '#ffffff' })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => {
        const token = localStorage.getItem('labrute_token');
        if (!token) {
          alert('You must sign in first.');
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

  private async handleRegister(email: string, password: string, name: string) {
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Register failed');
      localStorage.setItem('labrute_token', data.token);
      alert('Account created, logged in.');
      // Auto redirect after successful registration
      this.scene.start('CharacterCreateScene');
    } catch (e: any) {
      alert(e.message || String(e));
    }
  }

  private async handleLogin(email: string, password: string) {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Login failed');
      localStorage.setItem('labrute_token', data.token);
      // Auto redirect after successful login
      this.scene.start('CharacterCreateScene');
    } catch (e: any) {
      alert(e.message || String(e));
    }
  }
}
