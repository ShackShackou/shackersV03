const MatchmakingService = require('../matchmaking/MatchmakingService');
const FightManager = require('../combat/FightManager');

class MasterServer {
  matchmaking: any;
  fightManager: any;

  constructor() {
    this.matchmaking = new MatchmakingService();
    this.fightManager = new FightManager();
  }
}

const masterServer = new MasterServer();

export default masterServer;
