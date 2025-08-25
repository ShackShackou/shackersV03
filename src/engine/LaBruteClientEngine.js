// LaBrute Client Engine - Lightweight Wrapper for MMO Architecture
// This engine does NO combat calculations - it only receives and processes server data
// All combat logic runs server-side for anti-cheat protection

class LaBruteClientEngine {
  constructor() {
    this.serverUrl = 'http://localhost:4000'; // Server endpoint
    this.currentFight = null;
    this.onStepCallback = null;
    this.onFightEndCallback = null;
  }

  /**
   * Request a fight from the server - NO client-side calculation
   * @param {string} brute1Id - First brute ID
   * @param {string} brute2Id - Second brute ID
   * @returns {Promise} Fight data from server
   */
  async requestFight(brute1Id, brute2Id) {
    try {
      console.log(`🔥 Requesting fight from server: ${brute1Id} vs ${brute2Id}`);
      
      const response = await fetch(`${this.serverUrl}/api/fights/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
          // 'Authorization': `Bearer ${this.getAuthToken()}` // Disabled for testing
        },
        body: JSON.stringify({
          shackerAId: brute1Id,
          shackerBId: brute2Id
        })
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const fightData = await response.json();
      
      console.log('✅ Fight data received from server:', {
        fightId: fightData.fight.fightId,
        winner: fightData.fight.winner,
        stepsCount: fightData.steps.length
      });

      this.currentFight = fightData;
      return fightData;

    } catch (error) {
      console.error('❌ Failed to request fight from server:', error);
      throw new Error('Unable to connect to combat server');
    }
  }

  /**
   * Process fight steps for animation - receives server data only
   * @param {Array} steps - Combat steps from server
   * @param {Array} fighters - Fighter data from server
   */
  async processFightSteps(steps, fighters) {
    if (!steps || !Array.isArray(steps)) {
      throw new Error('Invalid steps data from server');
    }

    console.log(`🎬 Processing ${steps.length} fight steps from server`);
    
    this.fighters = fighters;
    
    // Process each step sequentially for proper animation timing
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      
      try {
        await this.processStep(step, i);
        
        // Add delay between steps for visual clarity
        await this.delay(500); // 500ms between steps
        
      } catch (error) {
        console.error(`Error processing step ${i}:`, error);
      }
    }
    
    // Fight completed
    if (this.onFightEndCallback) {
      this.onFightEndCallback(this.currentFight);
    }
  }

  /**
   * Process a single combat step - pure animation, no logic
   * @param {Object} step - Step data from server
   * @param {number} index - Step index
   */
  async processStep(step, index) {
    console.log(`Step ${index}: ${step.a}`, step);
    
    // Trigger callback for scene animation
    if (this.onStepCallback) {
      await this.onStepCallback(step, index);
    }

    // Client-side step processing for visual effects only
    switch (step.a) {
      case 'arrive':
        await this.animateArrival(step);
        break;
      case 'move':
        await this.animateMove(step);
        break;
      case 'hit':
        await this.animateHit(step);
        break;
      case 'evade':
        await this.animateEvade(step);
        break;
      case 'block':
        await this.animateBlock(step);
        break;
      case 'death':
        await this.animateDeath(step);
        break;
      case 'end':
        await this.animateEnd(step);
        break;
      default:
        console.log(`Unknown step type: ${step.a}`);
    }
  }

  /**
   * Animation methods - pure visual, no game logic
   */
  async animateArrival(step) {
    console.log(`🚶 Fighter ${step.f} arrives`);
    // Visual animation only - no stat calculations
  }

  async animateMove(step) {
    console.log(`🏃 Fighter ${step.f} moves to ${step.t}`);
    // Movement animation only
  }

  async animateHit(step) {
    console.log(`👊 Fighter ${step.f} hits ${step.t} for ${step.d} damage`);
    // Hit animation and damage display only
  }

  async animateEvade(step) {
    console.log(`🤸 Fighter ${step.f} evades`);
    // Evasion animation only
  }

  async animateBlock(step) {
    console.log(`🛡️ Fighter ${step.f} blocks`);
    // Block animation only
  }

  async animateDeath(step) {
    console.log(`💀 Fighter ${step.f} dies`);
    // Death animation only
  }

  async animateEnd(step) {
    console.log(`🏆 Fight ends - Winner: ${step.w}, Loser: ${step.l}`);
    // Victory animation only
  }

  /**
   * Validate fight result with server (anti-cheat)
   * @param {string} fightId - Fight ID to validate
   */
  async validateFight(fightId) {
    try {
      const response = await fetch(`${this.serverUrl}/api/fights/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          fightId,
          userId: this.getCurrentUserId()
        })
      });

      const result = await response.json();
      
      if (result.valid) {
        console.log('✅ Fight validated by server');
        return true;
      } else {
        console.error('❌ Fight validation failed:', result.error);
        return false;
      }

    } catch (error) {
      console.error('Fight validation error:', error);
      return false;
    }
  }

  /**
   * Set callback for step processing
   */
  onStep(callback) {
    this.onStepCallback = callback;
  }

  /**
   * Set callback for fight end
   */
  onFightEnd(callback) {
    this.onFightEndCallback = callback;
  }

  /**
   * Utility methods
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getAuthToken() {
    // Return auth token from localStorage or session
    return localStorage.getItem('authToken') || 'mock-token';
  }

  getCurrentUserId() {
    // Return current user ID
    return localStorage.getItem('userId') || 'mock-user';
  }

  /**
   * Get fighter data by index
   */
  getFighter(index) {
    return this.fighters ? this.fighters[index] : null;
  }

  /**
   * Start fight processing - main entry point
   */
  async startFight(brute1Id, brute2Id) {
    try {
      // Request fight from server
      const fightData = await this.requestFight(brute1Id, brute2Id);
      
      // Process the steps for animation
      await this.processFightSteps(fightData.steps, fightData.fighters);
      
      // Validate the result
      await this.validateFight(fightData.fight.fightId);
      
      return fightData;
      
    } catch (error) {
      console.error('Fight processing failed:', error);
      throw error;
    }
  }
}

// Export for use in game scenes
window.LaBruteClientEngine = LaBruteClientEngine;
export default LaBruteClientEngine;