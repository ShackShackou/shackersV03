import { Router } from 'express';
import { LaBruteEngine } from '../../combat/LaBruteEngine.js';
import Rand from 'rand-seed';

const router = Router();

// Test endpoint - generates combat with REAL LaBrute engine
router.post('/test', async (req: any, res) => {
  try {
    console.log('🎯 VRAI MOTEUR LABRUTE - Test fight requested:', req.body);
    
    // Create BALANCED test profiles for better testing
    const testProfiles = {
      tank: {
        id: 'tank-profile',
        name: 'Tank Fighter',
        level: 10,
        strength: 18,
        agility: 10,
        speed: 10,
        hp: 150,
        skills: ['armor', 'resistant', 'vitality'],
        weapons: [],  // Pas d'armes pour l'instant
        body: '1234567890',
        colors: '12345678',
        gender: 'male',
        rank: 3
      },
      assassin: {
        id: 'assassin-profile', 
        name: 'Speed Fighter',
        level: 10,
        strength: 15,
        agility: 20,
        speed: 20,
        hp: 120,
        skills: ['felineAgility', 'untouchable', 'sixthSense'],
        weapons: [],  // Pas d'armes pour l'instant
        body: '0987654321',
        colors: '87654321',
        gender: 'female',
        rank: 2
      },
      berserker: {
        id: 'berserker-profile',
        name: 'Berserker',
        level: 10,
        strength: 20,
        agility: 12,
        speed: 12,
        hp: 140,
        skills: ['weaponsMaster', 'fistsOfFury'],  // Plus équilibré
        weapons: [],  // Pas d'armes pour l'instant
        body: '1122334455',
        colors: '55443322',
        gender: 'male',
        rank: 4
      },
      agile: {
        id: 'agile-profile',
        name: 'Balanced Fighter',
        level: 10,
        strength: 16,
        agility: 16,
        speed: 16,
        hp: 130,
        skills: ['balletShoes', 'determination'],
        weapons: [],  // Pas d'armes pour l'instant
        body: '5566778899',
        colors: '99887766',
        gender: 'female',
        rank: 1
      }
    };
    
    // Seed for deterministic fights
    const seed = typeof req.body.seed === 'number' ? req.body.seed : Date.now();

    // Sélection des combattants (utilise les profils ou les IDs fournis)
    const profile1 = req.body.profile1 || 'tank';
    const profile2 = req.body.profile2 || 'assassin';
    
    const brute1 = testProfiles[profile1] || testProfiles.tank;
    const brute2 = testProfiles[profile2] || testProfiles.assassin;
    
    console.log(`⚔️ COMBAT AUTHENTIQUE: ${brute1.name} (${profile1}) VS ${brute2.name} (${profile2})`);
    console.log(`   - Seed utilisé: ${seed}`);

    // UTILISATION DU VRAI MOTEUR LABRUTE avec RNG seedé
    const rand = new Rand(seed);
    const engine = new LaBruteEngine(rand.next.bind(rand));
    const combatResult = engine.generateFight(brute1, brute2);
    
    // Structure de réponse compatible avec le client
    const fightResult = {
      fight: {
        fightId: `authentic_fight_${Date.now()}`,
        winner: combatResult.winner,
        loser: combatResult.loser,
        fighters: combatResult.fighters,
        engine: 'AUTHENTIC_LABRUTE_ENGINE',
        totalSteps: combatResult.steps.length,
        profiles: [profile1, profile2],
        seed
      },
      // STEPS AUTHENTIQUES avec types officiels
      steps: combatResult.steps
    };

    console.log('✅ COMBAT GÉNÉRÉ PAR LE VRAI MOTEUR LABRUTE:');
    console.log(`   - ${combatResult.steps.length} steps authentiques`);
    console.log(`   - Vainqueur: ${combatResult.winner}`);
    console.log(`   - Types de steps: ${[...new Set(combatResult.steps.map(s => s.a))].join(', ')}`);
    
    res.json(fightResult);
    
  } catch (error) {
    console.error('❌ Error in AUTHENTIC LaBrute engine:', error);
    res.status(500).json({ 
      error: 'Failed to generate fight with authentic LaBrute engine',
      details: error.message 
    });
  }
});

export default router;