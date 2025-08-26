const MatchmakingService = require('../matchmaking/MatchmakingService');
const FightManager = require('../combat/FightManager');
const { PrismaClient } = require('@prisma/client');
const { Server } = require('socket.io');

/**
 * MasterServer orchestrates matchmaking, combat generation and persistence.
 * It exposes a websocket layer used by clients to receive match notifications
 * and supports reconnection thanks to socket.io built-in mechanisms.
 */
class MasterServer {
  /**
   * @param {http.Server} httpServer - optional existing HTTP server to attach socket.io
   */
  constructor(httpServer) {
    this.matchmaking = new MatchmakingService();
    this.fightManager = new FightManager();
    this.prisma = new PrismaClient();

    // Map of userId -> socket for notifications
    this.clients = new Map();

    // Setup WebSocket notifications
    this.io = new Server(httpServer || undefined, {
      cors: { origin: '*' }
    });

    this.io.on('connection', (socket) => {
      const { userId } = socket.handshake.query;
      if (userId) {
        this.clients.set(userId, socket);
        socket.on('disconnect', () => {
          this.clients.delete(userId);
        });
      }
    });

    // Listen for matchmaking events
    this.matchmaking.on('matchCreated', (match) => this.handleMatch(match));
  }

  /**
   * Handle a newly created match: generate fight, persist result and notify players
   * @param {Object} match - match object from MatchmakingService
   */
  async handleMatch(match) {
    const { player1, player2, matchId } = match;
    try {
      const fight = this.fightManager.generateFight(player1.bruteData, player2.bruteData);

      // Update ratings using MatchmakingService logic
      const ratings = this.matchmaking.updatePlayerRating(
        fight.winner.id,
        fight.loser.id
      );

      // Persist match result
      await this.prisma.match.create({
        data: {
          matchId,
          player1Id: player1.userId,
          player2Id: player2.userId,
          winnerId: fight.winner.id,
          log: JSON.stringify(fight),
          player1Rating: ratings.winnerRating,
          player2Rating: ratings.loserRating
        }
      });

      // Notify participants via websocket
      this.notifyPlayer(player1.userId, { type: 'fightResult', fight });
      this.notifyPlayer(player2.userId, { type: 'fightResult', fight });
    } catch (error) {
      console.error('MasterServer handleMatch error', error);
    }
  }

  /**
   * Send a payload to a player if connected
   */
  notifyPlayer(userId, payload) {
    const socket = this.clients.get(userId);
    if (socket) {
      socket.emit('notification', payload);
    }
  }
}

module.exports = MasterServer;
