import { Router } from 'express';
import prisma from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { LaBruteTournament } from '../../../src/engine/labrute-complete.js';

const router = Router();

// Route pour obtenir le tournoi du jour
router.get('/current', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let tournament = await prisma.tournament.findFirst({
      where: {
        date: {
          gte: today
        }
      }
    });
    
    if (!tournament) {
      // Créer un nouveau tournoi
      tournament = await prisma.tournament.create({
        data: {
          date: new Date(),
          status: 'pending',
          brackets: '[]'
        }
      });
    }
    
    return res.json(tournament);
  } catch (error) {
    console.error('Get tournament error:', error);
    return res.status(500).json({ error: 'Failed to get tournament' });
  }
});

// Route pour obtenir les participants du tournoi
router.get('/participants', async (req, res) => {
  try {
    // Obtenir les 16 meilleurs shackers par niveau et XP
    const participants = await prisma.shacker.findMany({
      orderBy: [
        { level: 'desc' },
        { xp: 'desc' }
      ],
      take: 16,
      select: {
        id: true,
        name: true,
        level: true,
        xp: true,
        strength: true,
        agility: true,
        speed: true,
        endurance: true,
        weapons: true,
        skills: true,
        pet: true
      }
    });
    
    // Parser les champs JSON
    const formattedParticipants = participants.map(p => ({
      ...p,
      weapons: JSON.parse(p.weapons),
      skills: JSON.parse(p.skills),
      stats: {
        strength: p.strength,
        agility: p.agility,
        speed: p.speed,
        endurance: p.endurance
      }
    }));
    
    return res.json(formattedParticipants);
  } catch (error) {
    console.error('Get participants error:', error);
    return res.status(500).json({ error: 'Failed to get participants' });
  }
});

// Route pour inscrire un shacker au tournoi
router.post('/join', requireAuth, async (req: AuthRequest, res) => {
  const { shackerId } = req.body;
  const userId = req.userId!;
  
  try {
    // Vérifier que le shacker appartient à l'utilisateur
    const shacker = await prisma.shacker.findFirst({
      where: { id: shackerId, userId }
    });
    
    if (!shacker) {
      return res.status(404).json({ error: 'Shacker not found' });
    }
    
    // Vérifier l'heure du tournoi
    const now = new Date();
    const tournamentHour = 18;
    
    if (now.getHours() >= tournamentHour) {
      return res.status(400).json({ error: 'Tournament registration closed' });
    }
    
    // TODO: Ajouter le shacker à la liste des participants du tournoi
    // Pour l'instant, on retourne simplement un succès
    
    return res.json({ 
      message: 'Successfully joined tournament',
      shacker: shacker.name
    });
  } catch (error) {
    console.error('Join tournament error:', error);
    return res.status(500).json({ error: 'Failed to join tournament' });
  }
});

// Route pour simuler un round du tournoi
router.post('/simulate-round', async (req, res) => {
  const { tournamentId } = req.body;
  
  try {
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId }
    });
    
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }
    
    if (tournament.status === 'completed') {
      return res.status(400).json({ error: 'Tournament already completed' });
    }
    
    // Parser les brackets
    const brackets = JSON.parse(tournament.brackets);
    
    // TODO: Implémenter la simulation du round
    // Pour l'instant, on retourne les brackets tels quels
    
    return res.json({ brackets });
  } catch (error) {
    console.error('Simulate round error:', error);
    return res.status(500).json({ error: 'Failed to simulate round' });
  }
});

// Route pour obtenir les récompenses du tournoi
router.get('/rewards/:position', async (req, res) => {
  const position = parseInt(req.params.position);
  
  const tournamentEngine = new LaBruteTournament();
  const rewards = tournamentEngine.getTournamentRewards(position);
  
  return res.json(rewards);
});

// Route pour mettre à jour les statistiques après un tournoi
router.post('/:id/complete', async (req, res) => {
  const { id } = req.params;
  const { winnerId, finalStandings } = req.body;
  
  try {
    // Mettre à jour le tournoi
    const tournament = await prisma.tournament.update({
      where: { id },
      data: {
        status: 'completed',
        winnerId
      }
    });
    
    // Mettre à jour les statistiques des participants
    if (winnerId) {
      await prisma.shacker.update({
        where: { id: winnerId },
        data: {
          tournamentWins: { increment: 1 },
          tournamentBest: 'Champion',
          xp: { increment: 100 } // Récompense XP du champion
        }
      });
    }
    
    // TODO: Mettre à jour les autres participants selon leur position
    
    return res.json(tournament);
  } catch (error) {
    console.error('Complete tournament error:', error);
    return res.status(500).json({ error: 'Failed to complete tournament' });
  }
});

export default router;