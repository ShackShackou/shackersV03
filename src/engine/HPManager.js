/**
 * Gestionnaire centralisé des HP pour synchroniser backend et frontend
 * Résout les problèmes de désynchronisation des barres de vie
 */
export class HPManager {
    constructor() {
        this.fighters = new Map();
        this.listeners = [];
        this.history = [];
        this.debug = false;
    }

    /**
     * Enregistre un combattant avec ses HP initiaux et ses skills
     */
    registerFighter(id, maxHP, currentHP = null, skills = []) {
        const fighter = {
            id,
            maxHP: Math.max(1, Math.floor(maxHP)),
            currentHP: currentHP !== null ? Math.max(0, Math.floor(currentHP)) : Math.max(1, Math.floor(maxHP)),
            previousHP: currentHP !== null ? Math.max(0, Math.floor(currentHP)) : Math.max(1, Math.floor(maxHP)),
            isDead: false,
            hasSurvived: false, // Pour le skill "survival"
            skills: skills || [] // Skills du combattant
        };
        
        this.fighters.set(id, fighter);
        this.log(`Registered fighter ${id}: HP ${fighter.currentHP}/${fighter.maxHP}`);
        
        return fighter;
    }

    /**
     * Applique des dégâts à un combattant avec protection overhit (comme LaBrute officiel)
     * @returns {Object} Résultat avec les HP avant/après et si le fighter est mort
     */
    applyDamage(fighterId, damage, fix = false) {
        const fighter = this.fighters.get(fighterId);
        if (!fighter) {
            console.error(`Fighter ${fighterId} not found!`);
            return null;
        }

        // PROTECTION TOTALE : Aucun dégât sur un combattant mort (comme LaBrute officiel)
        if (fighter.isDead && !fix) {
            this.log(`[DEAD PROTECTION] Fighter ${fighterId} is already dead, completely ignoring ${damage} damage`);
            return {
                fighterId,
                previousHP: 0,
                currentHP: 0,
                damage: 0,
                isDead: true,
                ignored: true,
                reason: 'already_dead'
            };
        }

        // Vérification supplémentaire : HP déjà à 0
        if (fighter.currentHP <= 0 && !fix) {
            this.log(`[ZERO HP PROTECTION] Fighter ${fighterId} has 0 HP, completely ignoring ${damage} damage`);
            fighter.isDead = true; // S'assurer que le statut mort est correct
            return {
                fighterId,
                previousHP: 0,
                currentHP: 0,
                damage: 0,
                isDead: true,
                ignored: true,
                reason: 'zero_hp'
            };
        }

        let actualDamage;
        const previousHP = fighter.currentHP;
        fighter.previousHP = previousHP;

        // PROTECTION OVERHIT COMME LABRUTE OFFICIEL
        if (fix) {
            // Mode fix : définir HP directement (utilisé pour forcer une valeur)
            fighter.currentHP = Math.max(0, Math.floor(damage));
            actualDamage = previousHP - fighter.currentHP;
        } else {
            // Mode delta : appliquer les dégâts avec protection overhit
            let realDamage = Math.max(0, Math.floor(damage));
            
            // PROTECTION CRITIQUE : Empêcher les overhits
            if (realDamage > 0) {
                if (fighter.currentHP <= 0) {
                    // Déjà mort, pas de dégâts supplémentaires
                    realDamage = 0;
                    this.log(`[OVERHIT PROTECTION] ${fighterId} already at 0 HP, ignoring ${damage} damage`);
                } else if (fighter.currentHP - realDamage < 0) {
                    // Limiter les dégâts aux HP restants
                    const originalDamage = realDamage;
                    realDamage = fighter.currentHP;
                    this.log(`[OVERHIT PROTECTION] Limiting damage from ${originalDamage} to ${realDamage} (remaining HP)`);
                }
            }
            
            fighter.currentHP = Math.max(0, previousHP - realDamage);
            actualDamage = realDamage;
        }

        // Vérifier si le combattant est mort
        let survived = false;
        if (fighter.currentHP <= 0) {
            // Skill "survival" : survit une fois avec 1 HP
            if (!fighter.hasSurvived && this.fighterHasSkill(fighterId, 'survival')) {
                fighter.currentHP = 1;
                fighter.hasSurvived = true;
                survived = true;
                this.log(`Survival skill triggered for ${fighterId}: HP set to 1`);
            } else {
                fighter.currentHP = 0;
                fighter.isDead = true;
            }
        }

        const result = {
            fighterId,
            previousHP,
            currentHP: fighter.currentHP,
            damage: actualDamage,
            isDead: fighter.isDead,
            survived: survived,
            healthPercent: fighter.maxHP > 0 ? (fighter.currentHP / fighter.maxHP) : 0,
            overhitPrevented: !fix && damage > actualDamage
        };

        this.log(`Damage applied to ${fighterId}: ${previousHP} - ${actualDamage} = ${fighter.currentHP} HP${result.overhitPrevented ? ' [OVERHIT PREVENTED]' : ''}`);
        this.addToHistory('damage', result);
        this.notifyListeners('damage', result);

        return result;
    }

    /**
     * Récupère les HP actuels d'un combattant
     */
    getCurrentHP(fighterId) {
        const fighter = this.fighters.get(fighterId);
        return fighter ? fighter.currentHP : null;
    }

    /**
     * Récupère les HP max d'un combattant
     */
    getMaxHP(fighterId) {
        const fighter = this.fighters.get(fighterId);
        return fighter ? fighter.maxHP : null;
    }

    /**
     * Apply damage to a fighter
     * @param {string} fighterName - Name of the fighter
     * @param {number} damage - Amount of damage to apply
     * @returns {Object} Result with new HP and if fighter died
     */
    applyDamage(fighterName, damage) {
        const fighter = this.fighters.get(fighterName);
        if (!fighter) {
            this.log(`Fighter not found: ${fighterName}`);
            return null;
        }

        // Protection against damage on dead fighters
        if (fighter.isDead) {
            this.log(`Fighter ${fighterName} is already dead, ignoring damage`);
            return {
                newHp: 0,
                isDead: true,
                damageDealt: 0
            };
        }

        const oldHp = fighter.currentHp;
        const actualDamage = Math.min(damage, fighter.currentHp); // Overhit protection
        fighter.currentHp = Math.max(0, fighter.currentHp - actualDamage);
        
        // Check for death
        if (fighter.currentHp <= 0) {
            fighter.isDead = true;
            this.log(`Fighter ${fighterName} has died!`);
        }

        this.log(`${fighterName}: ${oldHp} HP - ${actualDamage} dmg = ${fighter.currentHp} HP`);
        
        // Add to history
        this.addToHistory('damage', fighterName, {
            damage: actualDamage,
            oldHp,
            newHp: fighter.currentHp
        });
        
        // Notify listeners
        this.notifyListeners('damage', {
            fighter: fighterName,
            damage: actualDamage,
            oldHp,
            newHp: fighter.currentHp,
            isDead: fighter.isDead
        });
        
        return {
            newHp: fighter.currentHp,
            isDead: fighter.isDead,
            damageDealt: actualDamage
        };
    }

    /**
     * Applique des soins à un combattant
     */
    applyHeal(fighterId, healAmount) {
        const fighter = this.fighters.get(fighterId);
        if (!fighter) {
            console.error(`Fighter ${fighterId} not found!`);
            return null;
        }

        if (fighter.isDead) {
            this.log(`Fighter ${fighterId} is dead, cannot heal`);
            return {
                fighterId,
                previousHP: 0,
                currentHP: 0,
                heal: 0,
                isDead: true,
                ignored: true
            };
        }

        const actualHeal = Math.max(0, Math.floor(healAmount));
        const previousHP = fighter.currentHP;
        fighter.previousHP = previousHP;
        fighter.currentHP = Math.min(fighter.maxHP, previousHP + actualHeal);

        const result = {
            fighterId,
            previousHP,
            currentHP: fighter.currentHP,
            heal: actualHeal,
            actualHeal: fighter.currentHP - previousHP,
            isDead: false,
            healthPercent: fighter.maxHP > 0 ? (fighter.currentHP / fighter.maxHP) : 0
        };

        this.log(`Heal applied to ${fighterId}: ${previousHP} + ${actualHeal} = ${fighter.currentHP} HP (max: ${fighter.maxHP})`);
        this.addToHistory('heal', result);
        this.notifyListeners('heal', result);

        return result;
    }

    /**
     * Définit directement les HP (pour la synchronisation avec le backend)
     */
    setHP(fighterId, newHP, reason = 'sync') {
        const fighter = this.fighters.get(fighterId);
        if (!fighter) {
            console.error(`Fighter ${fighterId} not found!`);
            return null;
        }

        const previousHP = fighter.currentHP;
        fighter.previousHP = previousHP;
        fighter.currentHP = Math.max(0, Math.min(fighter.maxHP, Math.floor(newHP)));
        
        // Mettre à jour l'état de mort
        if (fighter.currentHP <= 0) {
            fighter.currentHP = 0;
            fighter.isDead = true;
        } else {
            fighter.isDead = false;
        }

        const result = {
            fighterId,
            previousHP,
            currentHP: fighter.currentHP,
            reason,
            isDead: fighter.isDead,
            healthPercent: fighter.maxHP > 0 ? (fighter.currentHP / fighter.maxHP) : 0
        };

        this.log(`HP set for ${fighterId}: ${previousHP} -> ${fighter.currentHP} (reason: ${reason})`);
        this.addToHistory('setHP', result);
        this.notifyListeners('setHP', result);

        return result;
    }

    /**
     * Applique le skill "survival" (survit avec 1 HP)
     */
    applySurvival(fighterId) {
        const fighter = this.fighters.get(fighterId);
        if (!fighter || fighter.hasSurvived) {
            return null;
        }

        fighter.currentHP = 1;
        fighter.isDead = false;
        fighter.hasSurvived = true;

        const result = {
            fighterId,
            currentHP: 1,
            survived: true
        };

        this.log(`Survival triggered for ${fighterId}: HP set to 1`);
        this.addToHistory('survival', result);
        this.notifyListeners('survival', result);

        return result;
    }

    /**
     * Récupère l'état actuel d'un combattant
     */
    getFighterStatus(fighterId) {
        const fighter = this.fighters.get(fighterId);
        if (!fighter) return null;

        return {
            id: fighter.id,
            currentHP: fighter.currentHP,
            maxHP: fighter.maxHP,
            healthPercent: fighter.maxHP > 0 ? (fighter.currentHP / fighter.maxHP) : 0,
            isDead: fighter.isDead,
            hasSurvived: fighter.hasSurvived
        };
    }

    /**
     * Vérifie si un combattant est mort
     */
    isDead(fighterId) {
        const fighter = this.fighters.get(fighterId);
        return fighter ? fighter.isDead : true;
    }

    /**
     * Vérifie si un combattant possède un skill spécifique
     */
    fighterHasSkill(fighterId, skillName) {
        const fighter = this.fighters.get(fighterId);
        return fighter ? fighter.skills.includes(skillName) : false;
    }

    /**
     * Ajoute un listener pour les changements de HP
     */
    addListener(callback) {
        this.listeners.push(callback);
    }

    /**
     * Retire un listener
     */
    removeListener(callback) {
        const index = this.listeners.indexOf(callback);
        if (index > -1) {
            this.listeners.splice(index, 1);
        }
    }

    /**
     * Notifie tous les listeners d'un changement
     */
    notifyListeners(type, data) {
        this.listeners.forEach(callback => {
            try {
                callback(type, data);
            } catch (error) {
                console.error('Error in HP listener:', error);
            }
        });
    }

    /**
     * Ajoute un événement à l'historique
     */
    addToHistory(type, data) {
        this.history.push({
            type,
            data,
            timestamp: Date.now()
        });

        // Limiter l'historique à 100 entrées
        if (this.history.length > 100) {
            this.history.shift();
        }
    }

    /**
     * Récupère l'historique des changements de HP
     */
    getHistory() {
        return [...this.history];
    }

    /**
     * Active/désactive le mode debug
     */
    setDebug(enabled) {
        this.debug = enabled;
    }

    /**
     * Log avec condition debug
     */
    log(message) {
        if (this.debug) {
            console.log(`[HPManager] ${message}`);
        }
    }

    /**
     * Réinitialise le gestionnaire
     */
    reset() {
        this.fighters.clear();
        this.history = [];
        this.log('HPManager reset');
    }

    /**
     * Process a combat step and sync HP values from server
     * @param {Object} step - Combat step from server
     */
    processCombatStep(step) {
        // Sync HP values from server if provided
        if (step.hp1 !== undefined && step.hp2 !== undefined) {
            // Assuming fighter indices 0 and 1 map to registered fighters
            const fighters = Array.from(this.fighters.keys());
            if (fighters[0]) {
                this.syncFromBackend(fighters[0], step.hp1);
            }
            if (fighters[1]) {
                this.syncFromBackend(fighters[1], step.hp2);
            }
            this.log(`Step HP sync: Fighter1=${step.hp1}, Fighter2=${step.hp2}`);
        }
    }

    /**
     * Synchronize HP from backend data
     * This is the PRIMARY method to ensure frontend matches backend
     * @param {string} fighterName - Name of the fighter
     * @param {number} backendHp - HP value from backend
     */
    syncFromBackend(fighterName, backendHp) {
        const fighter = this.fighters.get(fighterName);
        if (!fighter) {
            this.log(`Cannot sync - fighter not found: ${fighterName}`);
            return;
        }

        const oldHp = fighter.currentHp || fighter.currentHP;
        fighter.currentHp = Math.max(0, backendHp);
        fighter.currentHP = fighter.currentHp; // Maintain both for compatibility
        
        // Update death status
        if (fighter.currentHp <= 0 && !fighter.isDead) {
            fighter.isDead = true;
            this.log(`Fighter ${fighterName} marked as dead from backend sync`);
        }
        
        if (oldHp !== fighter.currentHp) {
            this.log(`SYNC: ${fighterName} HP updated from ${oldHp} to ${fighter.currentHp}`);
            
            // Notify listeners of sync
            this.notifyListeners('sync', {
                fighter: fighterName,
                oldHp,
                newHp: fighter.currentHp,
                isDead: fighter.isDead
            });
        }
    }

    /**
     * Synchronise avec les données du backend
     */
    syncWithBackend(fighterData) {
        fighterData.forEach(data => {
            const fighter = this.fighters.get(data.id);
            if (fighter) {
                this.setHP(data.id, data.currentHP, 'backend-sync');
            } else {
                this.registerFighter(data.id, data.maxHP, data.currentHP);
            }
        });
    }

    /**
     * Exporte l'état pour le debug
     */
    exportState() {
        const state = {
            fighters: {},
            history: this.getHistory()
        };

        this.fighters.forEach((fighter, id) => {
            state.fighters[id] = { ...fighter };
        });

        return state;
    }
}

// Singleton pour usage global
export const hpManager = new HPManager();