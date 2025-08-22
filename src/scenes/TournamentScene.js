// ================================================
// 🏆 SCÈNE DE TOURNOI LABRUTE
// ================================================

import { LaBruteTournament } from '../engine/labrute-complete.js';

export class TournamentScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TournamentScene' });
        this.tournament = null;
        this.participants = [];
    }
    
    create() {
        // Background
        this.add.rectangle(0, 0, 1920, 1080, 0x1a1a2e).setOrigin(0);
        
        // Title
        const titleText = this.add.text(960, 50, '🏆 TOURNOI LABRUTE', {
            fontSize: '48px',
            fontFamily: 'Arial Black',
            color: '#ffd700',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
        
        // Tournament time indicator
        const now = new Date();
        const tournamentHour = 18; // 18h
        const timeUntilTournament = (tournamentHour - now.getHours()) * 60 - now.getMinutes();
        
        if (timeUntilTournament > 0) {
            this.add.text(960, 120, `Prochain tournoi dans: ${Math.floor(timeUntilTournament/60)}h ${timeUntilTournament%60}min`, {
                fontSize: '24px',
                fontFamily: 'Arial',
                color: '#ffffff'
            }).setOrigin(0.5);
        } else {
            this.add.text(960, 120, 'TOURNOI EN COURS !', {
                fontSize: '32px',
                fontFamily: 'Arial Black',
                color: '#ff0000',
                stroke: '#ffffff',
                strokeThickness: 2
            }).setOrigin(0.5);
        }
        
        // Initialize tournament
        this.initializeTournament();
        
        // Draw bracket
        this.drawBracket();
        
        // Control buttons
        this.createControlButtons();
        
        // Info panel
        this.createInfoPanel();
    }
    
    async initializeTournament() {
        // Load participants from backend or generate test data
        try {
            const response = await fetch('/api/tournament/participants');
            if (response.ok) {
                this.participants = await response.json();
            } else {
                // Generate test participants
                this.participants = this.generateTestParticipants();
            }
        } catch (error) {
            console.log('Using test participants');
            this.participants = this.generateTestParticipants();
        }
        
        // Create tournament
        this.tournament = new LaBruteTournament();
        this.tournament.generateTournament(this.participants);
    }
    
    generateTestParticipants() {
        const names = [
            'Brutus', 'Maximus', 'Thor', 'Hercule', 
            'Achille', 'Leonidas', 'Spartacus', 'Atlas',
            'Zeus', 'Odin', 'Ragnar', 'Conan',
            'Kratos', 'Ares', 'Apollo', 'Perseus'
        ];
        
        return names.map((name, i) => ({
            name: name,
            level: 10 + Math.floor(Math.random() * 20),
            stats: {
                strength: 10 + Math.floor(Math.random() * 30),
                agility: 10 + Math.floor(Math.random() * 30),
                speed: 10 + Math.floor(Math.random() * 30),
                endurance: 10 + Math.floor(Math.random() * 30)
            },
            skills: this.getRandomSkills(),
            weapons: this.getRandomWeapons(),
            pet: Math.random() > 0.7 ? this.getRandomPet() : null
        }));
    }
    
    getRandomSkills() {
        const skills = [
            'herculeanStrength', 'felineAgility', 'lightningBolt',
            'vitality', 'martialArts', 'masterOfArms', 'tornado',
            'fierce', 'weaponMaster', 'armor', 'shield', 'toughSkin'
        ];
        
        const count = 1 + Math.floor(Math.random() * 3);
        const selected = [];
        
        for (let i = 0; i < count; i++) {
            const skill = skills[Math.floor(Math.random() * skills.length)];
            if (!selected.includes(skill)) {
                selected.push(skill);
            }
        }
        
        return selected;
    }
    
    getRandomWeapons() {
        const weapons = [
            'sword', 'axe', 'knife', 'broadsword', 'lance',
            'mace', 'morningstar', 'club', 'halberd', 'whip'
        ];
        
        const count = Math.floor(Math.random() * 3);
        const selected = [];
        
        for (let i = 0; i < count; i++) {
            const weapon = weapons[Math.floor(Math.random() * weapons.length)];
            if (!selected.includes(weapon)) {
                selected.push(weapon);
            }
        }
        
        return selected;
    }
    
    getRandomPet() {
        const pets = ['dog', 'bear', 'panther'];
        return pets[Math.floor(Math.random() * pets.length)];
    }
    
    drawBracket() {
        const startX = 100;
        const startY = 200;
        const matchHeight = 60;
        const matchWidth = 200;
        const roundGap = 250;
        
        // Clear existing bracket
        if (this.bracketGroup) {
            this.bracketGroup.destroy(true);
        }
        
        this.bracketGroup = this.add.group();
        
        // Draw each round
        this.tournament.brackets.forEach((round, roundIndex) => {
            const x = startX + roundIndex * roundGap;
            const totalHeight = round.length * matchHeight;
            const yOffset = (800 - totalHeight) / 2;
            
            // Round title
            const roundName = this.getRoundName(this.tournament.brackets.length - roundIndex);
            this.bracketGroup.add(
                this.add.text(x + matchWidth/2, startY - 30, roundName, {
                    fontSize: '20px',
                    fontFamily: 'Arial Bold',
                    color: '#ffd700'
                }).setOrigin(0.5)
            );
            
            round.forEach((match, matchIndex) => {
                const y = startY + yOffset + matchIndex * matchHeight * Math.pow(2, roundIndex);
                
                // Match box
                const matchBox = this.add.rectangle(x, y, matchWidth, matchHeight - 10, 0x2a2a3e, 0.9);
                matchBox.setStrokeStyle(2, 0xffd700);
                this.bracketGroup.add(matchBox);
                
                // Fighter names
                const fighter1Name = match.fighter1.isBye ? 'BYE' : 
                    `${match.fighter1.name} (${match.fighter1.level || 1})`;
                const fighter2Name = match.fighter2.isBye ? 'BYE' : 
                    `${match.fighter2.name} (${match.fighter2.level || 1})`;
                
                // Fighter 1
                const text1 = this.add.text(x - matchWidth/2 + 10, y - 10, fighter1Name, {
                    fontSize: '14px',
                    fontFamily: 'Arial',
                    color: match.winner === match.fighter1 ? '#00ff00' : '#ffffff'
                });
                this.bracketGroup.add(text1);
                
                // VS
                this.bracketGroup.add(
                    this.add.text(x, y, 'VS', {
                        fontSize: '12px',
                        fontFamily: 'Arial Bold',
                        color: '#ff0000'
                    }).setOrigin(0.5)
                );
                
                // Fighter 2
                const text2 = this.add.text(x - matchWidth/2 + 10, y + 10, fighter2Name, {
                    fontSize: '14px',
                    fontFamily: 'Arial',
                    color: match.winner === match.fighter2 ? '#00ff00' : '#ffffff'
                });
                this.bracketGroup.add(text2);
                
                // Make match clickable
                matchBox.setInteractive();
                matchBox.on('pointerover', () => {
                    matchBox.setFillStyle(0x3a3a4e);
                    this.showMatchDetails(match);
                });
                matchBox.on('pointerout', () => {
                    matchBox.setFillStyle(0x2a2a3e);
                });
                matchBox.on('pointerdown', () => {
                    this.simulateMatch(match);
                });
            });
        });
    }
    
    getRoundName(roundsFromFinal) {
        switch(roundsFromFinal) {
            case 1: return 'FINALE';
            case 2: return 'DEMI-FINALES';
            case 3: return 'QUARTS DE FINALE';
            case 4: return 'HUITIÈMES';
            case 5: return 'SEIZIÈMES';
            default: return `ROUND ${roundsFromFinal}`;
        }
    }
    
    createControlButtons() {
        // Simulate Next Round button
        const nextRoundBtn = this.add.rectangle(1600, 200, 200, 50, 0x4caf50);
        nextRoundBtn.setStrokeStyle(2, 0xffffff);
        nextRoundBtn.setInteractive();
        
        this.add.text(1600, 200, 'ROUND SUIVANT', {
            fontSize: '18px',
            fontFamily: 'Arial Bold',
            color: '#ffffff'
        }).setOrigin(0.5);
        
        nextRoundBtn.on('pointerdown', () => {
            this.advanceRound();
        });
        
        // Reset Tournament button
        const resetBtn = this.add.rectangle(1600, 280, 200, 50, 0xf44336);
        resetBtn.setStrokeStyle(2, 0xffffff);
        resetBtn.setInteractive();
        
        this.add.text(1600, 280, 'RÉINITIALISER', {
            fontSize: '18px',
            fontFamily: 'Arial Bold',
            color: '#ffffff'
        }).setOrigin(0.5);
        
        resetBtn.on('pointerdown', () => {
            this.initializeTournament();
            this.drawBracket();
        });
        
        // Back button
        const backBtn = this.add.rectangle(1600, 360, 200, 50, 0x9e9e9e);
        backBtn.setStrokeStyle(2, 0xffffff);
        backBtn.setInteractive();
        
        this.add.text(1600, 360, 'RETOUR', {
            fontSize: '18px',
            fontFamily: 'Arial Bold',
            color: '#ffffff'
        }).setOrigin(0.5);
        
        backBtn.on('pointerdown', () => {
            this.scene.start('HubUltraScene');
        });
    }
    
    createInfoPanel() {
        // Info panel background
        const panel = this.add.rectangle(1600, 600, 300, 400, 0x1a1a2e, 0.95);
        panel.setStrokeStyle(2, 0xffd700);
        
        // Title
        this.infoTitle = this.add.text(1600, 450, 'INFORMATIONS', {
            fontSize: '24px',
            fontFamily: 'Arial Bold',
            color: '#ffd700'
        }).setOrigin(0.5);
        
        // Content
        this.infoText = this.add.text(1600, 550, '', {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#ffffff',
            wordWrap: { width: 280 },
            align: 'center'
        }).setOrigin(0.5);
        
        // Initial info
        this.updateInfoPanel();
    }
    
    updateInfoPanel() {
        const totalParticipants = this.participants.length;
        const currentRound = this.tournament.currentRound + 1;
        const totalRounds = Math.ceil(Math.log2(totalParticipants));
        
        let infoContent = `Participants: ${totalParticipants}\n`;
        infoContent += `Round actuel: ${currentRound}/${totalRounds}\n\n`;
        
        // Show rewards
        infoContent += 'RÉCOMPENSES:\n';
        infoContent += '🥇 Champion: 100 XP\n';
        infoContent += '🥈 Finaliste: 50 XP\n';
        infoContent += '🥉 Demi: 30 XP\n';
        infoContent += 'Quarts: 15 XP\n';
        infoContent += 'Participant: 5 XP';
        
        this.infoText.setText(infoContent);
    }
    
    showMatchDetails(match) {
        if (!match.fighter1.isBye && !match.fighter2.isBye) {
            let details = 'DÉTAILS DU MATCH:\n\n';
            
            // Fighter 1
            details += `${match.fighter1.name}:\n`;
            if (match.fighter1.stats) {
                details += `FOR: ${match.fighter1.stats.strength || 0} `;
                details += `AGI: ${match.fighter1.stats.agility || 0}\n`;
                details += `VIT: ${match.fighter1.stats.speed || 0} `;
                details += `END: ${match.fighter1.stats.endurance || 0}\n`;
            }
            
            details += '\nVS\n\n';
            
            // Fighter 2
            details += `${match.fighter2.name}:\n`;
            if (match.fighter2.stats) {
                details += `FOR: ${match.fighter2.stats.strength || 0} `;
                details += `AGI: ${match.fighter2.stats.agility || 0}\n`;
                details += `VIT: ${match.fighter2.stats.speed || 0} `;
                details += `END: ${match.fighter2.stats.endurance || 0}\n`;
            }
            
            if (match.winner) {
                details += `\n🏆 Gagnant: ${match.winner.name}`;
            }
            
            this.infoText.setText(details);
        }
    }
    
    simulateMatch(match) {
        if (!match.winner && !match.fighter1.isBye && !match.fighter2.isBye) {
            // Simulate the match
            match.winner = this.tournament.simulateMatch(match.fighter1, match.fighter2);
            
            // Update display
            this.drawBracket();
            this.showMatchDetails(match);
            
            // Check if round is complete
            const currentRoundMatches = this.tournament.brackets[this.tournament.currentRound];
            const allMatchesComplete = currentRoundMatches.every(m => m.winner !== null);
            
            if (allMatchesComplete) {
                // Flash message
                const flashText = this.add.text(960, 540, 'ROUND TERMINÉ !', {
                    fontSize: '48px',
                    fontFamily: 'Arial Black',
                    color: '#ffd700',
                    stroke: '#000000',
                    strokeThickness: 6
                }).setOrigin(0.5);
                
                this.tweens.add({
                    targets: flashText,
                    alpha: 0,
                    duration: 2000,
                    onComplete: () => flashText.destroy()
                });
            }
        }
    }
    
    advanceRound() {
        const nextRound = this.tournament.advanceRound();
        
        if (nextRound && nextRound.length > 0) {
            this.drawBracket();
            this.updateInfoPanel();
        } else if (this.tournament.brackets[this.tournament.currentRound].length === 1) {
            // Tournament complete
            const winner = this.tournament.brackets[this.tournament.currentRound][0].winner;
            
            // Victory screen
            const victoryBg = this.add.rectangle(960, 540, 1920, 1080, 0x000000, 0.8);
            
            const victoryText = this.add.text(960, 400, '🏆 CHAMPION DU TOURNOI 🏆', {
                fontSize: '64px',
                fontFamily: 'Arial Black',
                color: '#ffd700',
                stroke: '#ffffff',
                strokeThickness: 4
            }).setOrigin(0.5);
            
            const winnerText = this.add.text(960, 500, winner.name, {
                fontSize: '48px',
                fontFamily: 'Arial Black',
                color: '#ffffff',
                stroke: '#ffd700',
                strokeThickness: 3
            }).setOrigin(0.5);
            
            // Animate victory
            this.tweens.add({
                targets: [victoryText, winnerText],
                scaleX: 1.2,
                scaleY: 1.2,
                duration: 1000,
                yoyo: true,
                repeat: -1
            });
        }
    }
}

export default TournamentScene;