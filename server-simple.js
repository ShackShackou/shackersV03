/**
 * Serveur Simple pour Test de Synchronisation HP
 * Backend minimaliste pour tester le combat avec synchronisation des barres de vie
 */

import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Import du moteur authentique (créer une version CommonJS)
class LaBruteEngine {
  constructor() {
    this.fighters = [];
    this.steps = [];
    this.seed = null;
    this.random = null;
  }

  initialize(seed = Date.now()) {
    this.seed = seed;
    let state = seed;
    this.random = () => {
      state |= 0;
      state = state + 0x6D2B79F5 | 0;
      let t = Math.imul(state ^ state >>> 15, 1 | state);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
    this.steps = [];
  }

  setFighters(f1, f2) {
    // Formule HP officielle: 50 + (endurance × 6)
    const maxHp1 = 50 + (f1.endurance || 10) * 6;
    const maxHp2 = 50 + (f2.endurance || 10) * 6;
    
    this.fighters = [
      {
        index: 0,
        name: f1.name || 'Fighter 1',
        hp: maxHp1,
        maxHp: maxHp1,
        strength: f1.strength || 10,
        agility: f1.agility || 10,
        speed: f1.speed || 10,
        endurance: f1.endurance || 10,
        baseDamage: 5,
        armor: 0
      },
      {
        index: 1,
        name: f2.name || 'Fighter 2',
        hp: maxHp2,
        maxHp: maxHp2,
        strength: f2.strength || 10,
        agility: f2.agility || 10,
        speed: f2.speed || 10,
        endurance: f2.endurance || 10,
        baseDamage: 5,
        armor: 0
      }
    ];
  }

  getDamage(attacker, defender) {
    const base = attacker.baseDamage;
    
    // Formule officielle LaBrute
    let damage = Math.floor(
      (base + attacker.strength * (0.2 + base * 0.05))
      * (0.8 + this.random() * 0.4)
    );
    
    // Coup critique (5% de chance)
    const criticalHit = this.random() < 0.05;
    if (criticalHit) {
      damage = Math.floor(damage * 2);
    }
    
    // Réduction par l'armure
    damage = Math.ceil(damage * (1 - defender.armor));
    
    // Minimum 1 dégât
    if (damage < 1) damage = 1;
    
    return { damage, criticalHit };
  }

  generateFight() {
    // Init step
    this.steps.push({
      a: 'init',
      fighters: this.fighters.map(f => ({
        index: f.index,
        name: f.name,
        hp: f.hp,
        maxHp: f.maxHp
      }))
    });

    // Déterminer qui commence
    const f1Initiative = this.fighters[0].agility * 0.6 + this.fighters[0].speed * 0.4 + this.random() * 10;
    const f2Initiative = this.fighters[1].agility * 0.6 + this.fighters[1].speed * 0.4 + this.random() * 10;
    
    let currentFighter = f1Initiative > f2Initiative ? 0 : 1;
    let maxTurns = 100;
    
    while (maxTurns > 0) {
      const attacker = this.fighters[currentFighter];
      const defender = this.fighters[1 - currentFighter];
      
      if (defender.hp <= 0) break;
      
      // Calculer et appliquer les dégâts
      const { damage, criticalHit } = this.getDamage(attacker, defender);
      defender.hp = Math.max(0, defender.hp - damage);
      
      // Créer le step avec les HP actuels
      const step = {
        a: 'hit',
        f: attacker.index,
        t: defender.index,
        d: damage,
        // IMPORTANT: Inclure les HP actuels dans chaque step
        hp: {
          [attacker.index]: attacker.hp,
          [defender.index]: defender.hp
        }
      };
      
      if (criticalHit) step.c = 1;
      
      this.steps.push(step);
      
      // Vérifier la mort
      if (defender.hp <= 0) {
        this.steps.push({
          a: 'death',
          f: defender.index,
          hp: {
            [attacker.index]: attacker.hp,
            [defender.index]: 0
          }
        });
        
        this.steps.push({
          a: 'end',
          w: attacker.index,
          l: defender.index,
          winner: attacker.name,
          loser: defender.name
        });
        break;
      }
      
      // Changer de combattant
      currentFighter = 1 - currentFighter;
      maxTurns--;
    }
    
    return {
      steps: this.steps,
      seed: this.seed
    };
  }
}

// Routes API
app.get('/api/test', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

app.post('/api/fight/generate', (req, res) => {
  const { fighter1, fighter2, seed } = req.body;
  
  const engine = new LaBruteEngine();
  engine.initialize(seed || Date.now());
  engine.setFighters(
    fighter1 || { name: 'Brutus', strength: 20, agility: 15, speed: 10, endurance: 15 },
    fighter2 || { name: 'Maximus', strength: 15, agility: 20, speed: 15, endurance: 12 }
  );
  
  const result = engine.generateFight();
  res.json(result);
});

// WebSocket pour combat temps réel
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  socket.on('requestFight', (data) => {
    const { fighter1, fighter2, seed } = data;
    
    const engine = new LaBruteEngine();
    engine.initialize(seed || Date.now());
    engine.setFighters(fighter1, fighter2);
    
    const result = engine.generateFight();
    
    // Envoyer les steps un par un avec délai
    let stepIndex = 0;
    const sendNextStep = () => {
      if (stepIndex < result.steps.length) {
        socket.emit('combatStep', {
          step: result.steps[stepIndex],
          index: stepIndex,
          total: result.steps.length
        });
        stepIndex++;
        setTimeout(sendNextStep, 500); // 500ms entre chaque step
      }
    };
    
    sendNextStep();
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 4001;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket ready on ws://localhost:${PORT}`);
});
