// MMO Matchmaking Service for LaBrute
// Handles player matching, queue management, and tournament organization

const Rand = require('../utils/Rand');

class MatchmakingService {
  constructor(rng = new Rand()) {
    this.rng = rng;
    this.playerQueue = new Map(); // userId -> player data
    this.activeFights = new Map(); // fightId -> fight data
    this.playerStats = new Map(); // userId -> { wins, losses, rating }
    this.matchHistory = []; // Recent matches for analysis
  }

  /**
   * Add player to matchmaking queue
   * @param {string} userId - Player ID
   * @param {Object} bruteData - Player's brute data
   * @param {Object} preferences - Matchmaking preferences
   */
  joinQueue(userId, bruteData, preferences = {}) {
    const player = {
      userId,
      bruteData,
      preferences,
      queueTime: Date.now(),
      rating: this.getPlayerRating(userId),
      searchRange: preferences.searchRange || 100 // Rating range for matching
    };

    this.playerQueue.set(userId, player);
    console.log(`🎮 Player ${bruteData.name} joined matchmaking queue`);

    // Try to find a match immediately
    this.findMatch(userId);
    
    return {
      inQueue: true,
      queuePosition: this.playerQueue.size,
      estimatedWait: this.estimateWaitTime(player)
    };
  }

  /**
   * Remove player from queue
   */
  leaveQueue(userId) {
    const removed = this.playerQueue.delete(userId);
    if (removed) {
      console.log(`🚪 Player ${userId} left matchmaking queue`);
    }
    return removed;
  }

  /**
   * Find suitable opponent for player
   */
  findMatch(userId) {
    const player = this.playerQueue.get(userId);
    if (!player) return null;

    // Find opponents within rating range
    const potentialOpponents = Array.from(this.playerQueue.values())
      .filter(opponent => 
        opponent.userId !== userId &&
        this.isValidMatch(player, opponent)
      )
      .sort((a, b) => Math.abs(a.rating - player.rating) - Math.abs(b.rating - player.rating));

    if (potentialOpponents.length > 0) {
      const opponent = potentialOpponents[0];
      return this.createMatch(player, opponent);
    }

    return null;
  }

  /**
   * Check if two players can be matched
   */
  isValidMatch(player1, player2) {
    // Rating difference check
    const ratingDiff = Math.abs(player1.rating - player2.rating);
    const maxDiff = Math.max(player1.searchRange, player2.searchRange);
    
    if (ratingDiff > maxDiff) {
      return false;
    }

    // Level difference check (optional)
    const levelDiff = Math.abs(player1.bruteData.level - player2.bruteData.level);
    if (levelDiff > 10) { // Max 10 level difference
      return false;
    }

    // Avoid recent opponents (prevent farming)
    const recentOpponents = this.getRecentOpponents(player1.userId);
    if (recentOpponents.includes(player2.userId)) {
      return false;
    }

    return true;
  }

  /**
   * Create a match between two players
   */
  createMatch(player1, player2) {
    // Remove both players from queue
    this.playerQueue.delete(player1.userId);
    this.playerQueue.delete(player2.userId);

    const matchId = `match_${Date.now()}_${this.rng.next().toString(36).substr(2, 9)}`;
    const match = {
      matchId,
      player1,
      player2,
      status: 'created',
      createdAt: Date.now(),
      estimatedDuration: 120000 // 2 minutes estimated
    };

    this.activeFights.set(matchId, match);
    
    console.log(`⚔️ Match created: ${player1.bruteData.name} vs ${player2.bruteData.name}`);
    
    return match;
  }

  /**
   * Get player's current rating
   */
  getPlayerRating(userId) {
    const stats = this.playerStats.get(userId);
    if (!stats) {
      // New player starts at 1000 rating
      this.playerStats.set(userId, { wins: 0, losses: 0, rating: 1000 });
      return 1000;
    }
    return stats.rating;
  }

  /**
   * Update player rating after match
   */
  updatePlayerRating(winnerId, loserId) {
    const winnerStats = this.playerStats.get(winnerId) || { wins: 0, losses: 0, rating: 1000 };
    const loserStats = this.playerStats.get(loserId) || { wins: 0, losses: 0, rating: 1000 };

    // ELO-style rating calculation
    const K = 32; // K-factor
    const expectedWin = 1 / (1 + Math.pow(10, (loserStats.rating - winnerStats.rating) / 400));
    const expectedLoss = 1 - expectedWin;

    // Update ratings
    winnerStats.rating += K * (1 - expectedWin);
    winnerStats.wins++;
    
    loserStats.rating += K * (0 - expectedLoss);
    loserStats.losses++;

    // Ensure ratings don't go below 0
    winnerStats.rating = Math.max(0, winnerStats.rating);
    loserStats.rating = Math.max(0, loserStats.rating);

    this.playerStats.set(winnerId, winnerStats);
    this.playerStats.set(loserId, loserStats);

    console.log(`📊 Rating updated: Winner ${Math.round(winnerStats.rating)}, Loser ${Math.round(loserStats.rating)}`);

    return { winnerRating: winnerStats.rating, loserRating: loserStats.rating };
  }

  /**
   * Process match completion
   */
  completeMatch(matchId, winnerId, loserId, fightData) {
    const match = this.activeFights.get(matchId);
    if (!match) {
      throw new Error('Match not found');
    }

    match.status = 'completed';
    match.completedAt = Date.now();
    match.winnerId = winnerId;
    match.loserId = loserId;
    match.fightData = fightData;

    // Update ratings
    const ratings = this.updatePlayerRating(winnerId, loserId);

    // Add to match history
    this.matchHistory.push({
      ...match,
      duration: match.completedAt - match.createdAt,
      ratings
    });

    // Keep only recent 1000 matches in memory
    if (this.matchHistory.length > 1000) {
      this.matchHistory.shift();
    }

    // Remove from active fights
    this.activeFights.delete(matchId);

    console.log(`✅ Match completed: ${matchId}`);
    return match;
  }

  /**
   * Get recent opponents to avoid rematches
   */
  getRecentOpponents(userId, limit = 5) {
    return this.matchHistory
      .filter(match => match.player1.userId === userId || match.player2.userId === userId)
      .slice(-limit)
      .map(match => match.player1.userId === userId ? match.player2.userId : match.player1.userId);
  }

  /**
   * Estimate queue wait time
   */
  estimateWaitTime(player) {
    const queueSize = this.playerQueue.size;
    const averageMatchTime = this.getAverageMatchTime();
    
    // Simple estimation: more players = less wait time
    if (queueSize < 2) return 60000; // 1 minute if alone
    if (queueSize < 5) return 30000; // 30 seconds if few players
    return 10000; // 10 seconds if many players
  }

  /**
   * Get average match duration for estimation
   */
  getAverageMatchTime() {
    if (this.matchHistory.length === 0) return 120000; // Default 2 minutes

    const recentMatches = this.matchHistory.slice(-20);
    const totalTime = recentMatches.reduce((sum, match) => sum + (match.duration || 120000), 0);
    return totalTime / recentMatches.length;
  }

  /**
   * Get queue status for admin/debugging
   */
  getQueueStatus() {
    return {
      playersInQueue: this.playerQueue.size,
      activeFights: this.activeFights.size,
      totalMatches: this.matchHistory.length,
      averageRating: this.getAverageRating(),
      queue: Array.from(this.playerQueue.values()).map(player => ({
        name: player.bruteData.name,
        rating: player.rating,
        waitTime: Date.now() - player.queueTime
      }))
    };
  }

  /**
   * Get average player rating
   */
  getAverageRating() {
    const ratings = Array.from(this.playerStats.values()).map(stats => stats.rating);
    if (ratings.length === 0) return 1000;
    return ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
  }

  /**
   * Cleanup old data periodically
   */
  cleanup() {
    const now = Date.now();
    const timeout = 300000; // 5 minutes

    // Remove players who've been in queue too long (disconnected?)
    for (const [userId, player] of this.playerQueue.entries()) {
      if (now - player.queueTime > timeout) {
        console.log(`🧹 Removing stale player from queue: ${player.bruteData.name}`);
        this.playerQueue.delete(userId);
      }
    }

    // Remove old active fights that never completed
    for (const [matchId, match] of this.activeFights.entries()) {
      if (now - match.createdAt > timeout) {
        console.log(`🧹 Removing stale match: ${matchId}`);
        this.activeFights.delete(matchId);
      }
    }
  }

  /**
   * Force match for testing (bypasses normal matching rules)
   */
  forceMatch(userId1, userId2) {
    const player1 = this.playerQueue.get(userId1);
    const player2 = this.playerQueue.get(userId2);
    
    if (!player1 || !player2) {
      throw new Error('Both players must be in queue');
    }

    return this.createMatch(player1, player2);
  }
}

module.exports = MatchmakingService;