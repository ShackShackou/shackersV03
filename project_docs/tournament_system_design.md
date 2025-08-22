# Système de Tournois - Design Détaillé

## Vue d'ensemble
Les tournois ajoutent une dimension compétitive au jeu, permettant aux joueurs de mesurer leurs Shackers contre d'autres dans des compétitions structurées.

## Types de Tournois

### 1. 🏅 Tournoi Quotidien "Brawl Express"
- **Fréquence**: Toutes les 4 heures (6 tournois par jour)
- **Participants**: 16 joueurs
- **Format**: Élimination directe
- **Durée**: 30 minutes
- **Entrée**: Gratuite
- **Restrictions**: 1 Shacker par joueur
- **Récompenses**:
  - 🥇 1er: 500 Or + 1 Arme aléatoire
  - 🥈 2e: 250 Or
  - 🥉 3e-4e: 100 Or

### 2. 🏆 Tournoi Hebdomadaire "Champion's Arena"
- **Fréquence**: Samedi et Dimanche à 20h
- **Participants**: 64 joueurs
- **Format**: Double élimination
- **Durée**: 2 heures
- **Entrée**: 100 Or
- **Restrictions**: Équipe de 3 Shackers
- **Récompenses**:
  - 🥇 1er: 5000 Or + Arme Rare + Compétence Rare
  - 🥈 2e: 2500 Or + Arme Rare
  - 🥉 3e: 1000 Or + Arme Commune
  - Top 8: 500 Or

### 3. 👑 Grand Tournoi Mensuel "Legends League"
- **Fréquence**: Dernier dimanche du mois
- **Participants**: 256 joueurs
- **Format**: Phases de poules + Élimination
- **Durée**: 4 heures
- **Entrée**: Qualification (Top 100 du mois)
- **Restrictions**: Équipe complète (5 Shackers)
- **Récompenses**:
  - 🥇 1er: 20000 Or + Arme Légendaire + Titre exclusif + Skin
  - 🥈 2e: 10000 Or + Arme Épique + Titre
  - 🥉 3e: 5000 Or + Arme Rare + Titre
  - Top 16: Récompenses variées

### 4. 🎭 Tournois Spéciaux
- **Tournoi des Novices**: Niveau 1-10 uniquement
- **Tournoi des Vétérans**: Niveau 20+ uniquement
- **Tournoi Sans Armes**: Combat à mains nues
- **Tournoi Mono-Type**: Une seule classe de Shacker
- **Tournoi Surprise**: Règles aléatoires

## Mécaniques de Tournoi

### Inscription
1. **File d'attente**: Les joueurs s'inscrivent et attendent
2. **Matchmaking**: Équilibrage par niveau moyen
3. **Confirmation**: 1 minute pour confirmer sa participation
4. **Remplacement**: Si un joueur ne confirme pas, le suivant prend sa place

### Déroulement
1. **Phase de Préparation** (5 min)
   - Choisir son équipe
   - Équiper les armes
   - Voir le bracket

2. **Rounds de Combat**
   - Combats automatiques
   - 3 minutes max par combat
   - Spectateurs peuvent regarder

3. **Entre les Rounds** (2 min)
   - Voir les résultats
   - Préparer la stratégie
   - Chat avec les spectateurs

### Système de Points (Ligues)
- Victoire en tournoi quotidien: +10 points
- Victoire en tournoi hebdomadaire: +50 points
- Victoire en tournoi mensuel: +200 points
- Participation: +1 point

## Interface Utilisateur

### Écran Principal des Tournois
```
┌─────────────────────────────────────┐
│        TOURNOIS ACTIFS              │
├─────────────────────────────────────┤
│ [Quotidien] Brawl Express           │
│ Commence dans: 15:32                │
│ Inscrits: 12/16                     │
│ [S'inscrire]                        │
├─────────────────────────────────────┤
│ [Hebdomadaire] Champion's Arena     │
│ Commence dans: 2j 4h                │
│ Inscrits: 31/64                     │
│ Coût: 100 Or                        │
│ [S'inscrire]                        │
└─────────────────────────────────────┘
```

### Écran de Bracket
- Vue arbre du tournoi
- Combats en cours en surbrillance
- Possibilité de cliquer pour voir les détails
- Replay des combats terminés

### Spectateur Mode
- Vue en direct des combats
- Chat spectateurs
- Paris amicaux (Or virtuel)
- Statistiques en temps réel

## Récompenses Spéciales

### Titres de Tournoi
- "Brawler" - 10 victoires quotidiennes
- "Champion" - 5 victoires hebdomadaires
- "Legend" - 1 victoire mensuelle
- "Gladiator" - 100 participations
- "Invincible" - 10 victoires consécutives

### Skins de Tournoi
- Aura dorée (victoire mensuelle)
- Couronne de champion
- Cape de vainqueur
- Effets de particules spéciaux

## Système de Saisons

### Saison de Tournoi (3 mois)
- Classement global des points
- Récompenses de fin de saison:
  - Top 1: Skin Légendaire + 50000 Or
  - Top 10: Skin Épique + 20000 Or
  - Top 100: Skin Rare + 10000 Or
  - Top 1000: 5000 Or

### Réinitialisation
- Les points sont remis à zéro
- Les récompenses sont distribuées
- Nouveau thème de saison

## Anti-Triche

### Mesures de Sécurité
- Vérification côté serveur
- Détection des patterns suspects
- Système de report par les joueurs
- Replays vérifiables

### Sanctions
- Avertissement
- Exclusion temporaire des tournois
- Ban permanent en cas de récidive

## Intégration avec le Reste du Jeu

### Missions de Tournoi
- "Participe à 3 tournois cette semaine"
- "Atteins les demi-finales"
- "Gagne un tournoi avec une équipe mono-type"

### Bonus de Clan
- +10% points si 3+ membres du clan participent
- Tournois inter-clans mensuels
- Récompenses partagées

### Système d'Entraînement
- Mode "Préparation Tournoi" 
- Analyse des adversaires potentiels
- Conseils stratégiques automatiques

## Évolutions Futures

### Phase 2
- Tournois personnalisés (créés par les joueurs)
- Paris sur les matchs
- Commentateurs IA

### Phase 3
- Tournois cross-server
- Championnats mondiaux
- Mode draft (choisir ses Shackers à tour de rôle)
