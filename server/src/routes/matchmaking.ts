import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';
import masterServer from '../masterServer';

const router = Router();
const matchmakingService = masterServer.matchmaking;
const fightManager = masterServer.fightManager;

// Schema validation
const JoinQueueSchema = z.object({
  bruteId: z.string().uuid(),
  preferences: z.object({
    searchRange: z.number().optional(),
    preferredLevel: z.number().optional()
  }).optional()
});

/**
 * Join matchmaking queue
 */
router.post('/queue/join', requireAuth, async (req: AuthRequest, res) => {
  const parse = JoinQueueSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: 'Invalid body', details: parse.error.flatten() });
  }

  const { bruteId, preferences } = parse.data;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    // Get brute data from database
    const brute = await prisma.shacker.findUnique({ 
      where: { id: bruteId },
      include: {
        owner: true // Include user data
      }
    });

    if (!brute) {
      return res.status(404).json({ error: 'Brute not found' });
    }

    // Verify ownership
    if (brute.ownerId !== userId) {
      return res.status(403).json({ error: 'Not your brute' });
    }

    // Join queue
    const queueStatus = matchmakingService.joinQueue(userId, brute, preferences);

    // Try to find immediate match
    const match = matchmakingService.findMatch(userId);
    
    if (match) {
      // Match found! Generate fight immediately
      const fightResult = fightManager.generateFight(
        match.player1.bruteData, 
        match.player2.bruteData
      );

      // Complete the match
      const winnerId = fightResult.winner === match.player1.bruteData.name 
        ? match.player1.userId 
        : match.player2.userId;
      const loserId = winnerId === match.player1.userId 
        ? match.player2.userId 
        : match.player1.userId;

      matchmakingService.completeMatch(match.matchId, winnerId, loserId, fightResult);

      return res.json({
        matchFound: true,
        match,
        fight: fightResult
      });
    }

    return res.json({
      matchFound: false,
      queueStatus,
      message: 'Searching for opponent...'
    });

  } catch (error) {
    console.error('Matchmaking error:', error);
    return res.status(500).json({ error: 'Matchmaking failed' });
  }
});

/**
 * Leave matchmaking queue
 */
router.post('/queue/leave', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const removed = matchmakingService.leaveQueue(userId);
  
  return res.json({
    success: removed,
    message: removed ? 'Left queue successfully' : 'Not in queue'
  });
});

/**
 * Get queue status
 */
router.get('/queue/status', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const status = matchmakingService.getQueueStatus();
  const playerInQueue = matchmakingService.playerQueue.has(userId);

  return res.json({
    ...status,
    playerInQueue,
    userRating: matchmakingService.getPlayerRating(userId)
  });
});

/**
 * Force match between two players (for testing)
 */
router.post('/match/force', requireAuth, async (req: AuthRequest, res) => {
  const { player1Id, player2Id } = req.body;
  
  try {
    const match = matchmakingService.forceMatch(player1Id, player2Id);
    
    // Generate fight immediately
    const fightResult = fightManager.generateFight(
      match.player1.bruteData, 
      match.player2.bruteData
    );

    return res.json({
      match,
      fight: fightResult
    });

  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

/**
 * Get player statistics
 */
router.get('/stats/:userId', requireAuth, async (req: AuthRequest, res) => {
  const { userId } = req.params;
  
  const stats = matchmakingService.playerStats.get(userId) || {
    wins: 0,
    losses: 0,
    rating: 1000
  };

  const winRate = stats.wins + stats.losses > 0 
    ? (stats.wins / (stats.wins + stats.losses) * 100).toFixed(1)
    : '0.0';

  return res.json({
    ...stats,
    winRate: `${winRate}%`,
    totalFights: stats.wins + stats.losses
  });
});

/**
 * Get match history
 */
router.get('/history', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const userMatches = matchmakingService.matchHistory
    .filter(match => 
      match.player1.userId === userId || match.player2.userId === userId
    )
    .slice(-20) // Last 20 matches
    .map(match => ({
      matchId: match.matchId,
      opponent: match.player1.userId === userId 
        ? match.player2.bruteData.name 
        : match.player1.bruteData.name,
      result: match.winnerId === userId ? 'win' : 'loss',
      duration: match.duration,
      completedAt: match.completedAt
    }));

  return res.json({ matches: userMatches });
});

// Cleanup task - run periodically
setInterval(() => {
  matchmakingService.cleanup();
}, 60000); // Every minute

export default router;