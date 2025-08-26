import MatchmakingService from '../matchmaking/MatchmakingService';
import FightManager from '../combat/FightManager';

class MasterServer {
  public matchmaking: MatchmakingService;
  public fightManager: FightManager;

  constructor() {
    this.matchmaking = new MatchmakingService();
    this.fightManager = new FightManager();
  }
}

const masterServer = new MasterServer();
export default masterServer;
