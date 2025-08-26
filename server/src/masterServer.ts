// Central MasterServer instance coordinating matchmaking and fights
// Imports legacy JS services and exposes singletons for use across routes

// eslint-disable-next-line @typescript-eslint/no-var-requires
const MatchmakingService = require('../matchmaking/MatchmakingService');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const FightManager = require('../combat/FightManager');

class MasterServer {
  public matchmaking: any;
  public fightManager: any;

  constructor() {
    this.matchmaking = new MatchmakingService();
    this.fightManager = new FightManager();
  }
}

const masterServer = new MasterServer();
export default masterServer;
