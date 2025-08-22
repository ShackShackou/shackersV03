import Phaser from 'phaser';

const API_BASE = 'http://localhost:4000/api';

type Shacker = {
  id: string;
  name: string;
  gender: 'male'|'female';
  level: number;
  hp: number;
  strength: number;
  agility: number;
  speed: number;
};

export default class MyShackersScene extends Phaser.Scene {
  private shackers: Shacker[] = [];
  private shackerAId: string | null = null;
  private shackerBId: string | null = null;
  private listText?: Phaser.GameObjects.Text;
  private resultText?: Phaser.GameObjects.Text;

  constructor() {
    super('MyShackersScene');
  }

  create() {
    const { width } = this.scale;
    this.add.text(width/2, 80, 'Mes shackers', { fontSize: '36px', color: '#ffffff' }).setOrigin(0.5);

    this.add.text(width/2, 120, '[ Rafraîchir la liste ]', { fontSize: '18px', color: '#00ccff' })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => this.fetchShackers());

    this.add.text(width/2, 160, '[ Créer un shacker ]', { fontSize: '18px', color: '#00ff88' })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => this.scene.start('CharacterCreateScene'));

    this.listText = this.add.text(80, 210, 'Chargement...', { fontSize: '18px', color: '#ffffaa' }).setOrigin(0,0);

    this.add.text(width/2, 520, '[ Combattre ! ]', { fontSize: '24px', color: '#ff6688' })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => this.startFight());

    this.resultText = this.add.text(width/2, 560, '', { fontSize: '18px', color: '#ffffff' }).setOrigin(0.5);

    this.fetchShackers();
  }

  private async fetchShackers() {
    const token = localStorage.getItem('labrute_token');
    if (!token) {
      alert('Tu dois te connecter.');
      this.scene.start('LoginScene');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/shackers`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Erreur de récupération');
      this.shackers = data as Shacker[];
      this.renderList();
    } catch (e: any) {
      alert(e.message || String(e));
    }
  }

  private renderList() {
    if (!this.listText) return;
    if (this.shackers.length === 0) {
      this.listText.setText('Aucun shacker. Crée-en un.');
      return;
    }
    const lines = this.shackers.map((b, i) => `${i+1}. ${b.name} [${b.id.slice(0,8)}] lvl ${b.level}`);
    this.listText.setText(lines.join('\n'));

    this.input.removeAllListeners();
    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      const y = pointer.y - this.listText!.y;
      const lineHeight = (this.listText!.style.metrics.fontSize as number) || 18;
      const index = Math.floor(y / lineHeight);
      if (index >= 0 && index < this.shackers.length) {
        const selected = this.shackers[index];
        if (!this.shackerAId || (this.shackerAId && this.shackerBId)) {
          this.shackerAId = selected.id;
          this.shackerBId = null;
        } else if (!this.shackerBId) {
          this.shackerBId = selected.id;
        }
        const mark = (id: string | null) => id ? id.slice(0,4) : '--';
        this.resultText?.setText(`Sélection: A=${mark(this.shackerAId)} B=${mark(this.shackerBId)}`);
      }
    });
  }

  private mapToEngineStats(b: Shacker) {
    // Scale values for visible HP bar changes and impactful hits
    const maxHealth = 80 + (b.hp ?? 10) * 6; // ~140 base if hp=10
    const strength = 6 + (b.strength ?? 3) * 4; // stronger hits
    const defense = 1 + Math.max(0, Math.floor((b.level ?? 1) / 5)); // small defense
    return {
      name: b.name,
      health: maxHealth,
      maxHealth,
      stamina: 100,
      maxStamina: 100,
      strength,
      defense,
      agility: (b.agility ?? 3),
      speed: (b.speed ?? 3),
      initiative: 0,
      baseInitiative: 1,
      counter: 0,
      combo: 0,
    };
  }

  private async startFight() {
    const token = localStorage.getItem('labrute_token');
    if (!token) { alert('Connecte-toi.'); return; }
    if (!this.shackerAId || !this.shackerBId || this.shackerAId === this.shackerBId) {
      alert('Choisis deux shackers distincts (clique deux lignes).');
      return;
    }
    const shackerA = this.shackers.find(b => b.id === this.shackerAId)!;
    const shackerB = this.shackers.find(b => b.id === this.shackerBId)!;

    try {
      await fetch(`${API_BASE}/fights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ shackerAId: this.shackerAId, shackerBId: this.shackerBId }),
      });
    } catch {}

    this.scene.start('FightSpine', {
      a: this.mapToEngineStats(shackerA),
      b: this.mapToEngineStats(shackerB),
    });
  }
}
