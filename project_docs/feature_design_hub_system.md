# Design Document: Système de Hub et Nouvelles Fonctionnalités

## Vue d'ensemble
Ce document détaille les nouvelles fonctionnalités à ajouter à LaBrute Reborn sans modifier le système de combat existant.

## 1. 🏛️ Système de Hub Principal

### Concept
- Un espace central personnalisé pour chaque joueur
- Vue isométrique ou 2.5D du camp/base du joueur
- Navigation entre différentes zones d'activités

### Zones du Hub
1. **Centre d'Entraînement** - Améliorer les stats des Shackers
2. **Forge** - Améliorer/créer des armes
3. **Chenil** - Gérer et entraîner les animaux
4. **Arène Privée** - Tester ses combattants
5. **Quartiers** - Repos et récupération
6. **Marché** - Commerce avec d'autres joueurs
7. **Salle des Trophées** - Afficher ses victoires

## 2. 💪 Système d'Entraînement

### Mécaniques d'Entraînement
- **Points d'Entraînement** : Gagnés après chaque combat
- **Sessions d'Entraînement** : Durée variable (5min à 2h)
- **Spécialisation** : Focus sur une stat spécifique

### Types d'Entraînement
1. **Force** : Sacs de frappe, haltères
2. **Agilité** : Parcours d'obstacles, esquive
3. **Vitesse** : Course, réflexes
4. **Endurance** : Course longue distance, résistance

### Système de Fatigue
- Les Shackers accumulent de la fatigue
- Besoin de repos entre les sessions
- Bonus si bien reposé

## 3. 🏗️ Construction de Base

### Bâtiments Constructibles
1. **Caserne** (Niveau 1-5)
   - Augmente le nombre max de Shackers
   - Niveau 1: 3 Shackers max
   - Niveau 5: 10 Shackers max

2. **Centre d'Entraînement** (Niveau 1-5)
   - Augmente l'efficacité de l'entraînement
   - Déblocage de nouvelles méthodes

3. **Forge** (Niveau 1-5)
   - Permet de créer des armes de meilleure qualité
   - Réparation d'armes endommagées

4. **Infirmerie** (Niveau 1-3)
   - Récupération plus rapide après les combats
   - Soins des blessures graves

5. **Marché** (Niveau 1-3)
   - Meilleurs prix de vente/achat
   - Accès à des objets rares

### Ressources
- **Or** : Monnaie principale (gagné en combat)
- **Matériaux** : Bois, Pierre, Métal (récompenses de combat)
- **Points de Gloire** : Pour débloquer des améliorations spéciales

## 4. 🏆 Système de Tournois

### Types de Tournois
1. **Tournoi Quotidien**
   - 16 participants
   - Récompenses modestes
   - Entrée gratuite

2. **Tournoi Hebdomadaire**
   - 64 participants
   - Récompenses importantes
   - Coût d'entrée: 100 Or

3. **Grand Tournoi Mensuel**
   - 256 participants
   - Récompenses légendaires
   - Qualification requise

### Format des Tournois
- Élimination directe
- Combat automatique (comme actuellement)
- Possibilité de regarder les replays

### Récompenses
- Or et Matériaux
- Armes/Compétences rares
- Titres et Trophées
- Points de Classement

## 5. 🎯 Système de Missions/Quêtes

### Missions Quotidiennes
- "Gagne 3 combats"
- "Entraîne un Shacker pendant 30 minutes"
- "Améliore un bâtiment"

### Missions Hebdomadaires
- "Participe à un tournoi"
- "Atteins le niveau 10 avec un Shacker"
- "Collectionne 5 armes différentes"

### Missions Spéciales
- Événements saisonniers
- Défis de boss spéciaux
- Missions coopératives

## 6. 🤝 Système de Clans/Guildes

### Fonctionnalités de Clan
- Créer/Rejoindre un clan (max 50 membres)
- Chat de clan intégré
- Guerres de clans hebdomadaires
- Bâtiments de clan partagés

### Avantages du Clan
- Bonus d'XP partagés
- Échange d'équipements
- Tournois exclusifs au clan
- Raids de boss en groupe

## 7. 🎨 Personnalisation Avancée

### Cosmétiques
- Skins pour les Shackers
- Bannières personnalisées
- Effets visuels spéciaux
- Animations de victoire

### Système de Prestige
- Niveaux de prestige après niveau max
- Étoiles dorées sur le profil
- Déblocage de cosmétiques exclusifs

## 8. 📊 Système de Progression

### Niveaux de Joueur
- XP du compte global
- Déblocage progressif de fonctionnalités
- Récompenses par palier

### Saisons
- Saisons de 3 mois
- Pass de combat avec récompenses
- Défis saisonniers
- Réinitialisation du classement

## 9. 🎮 Nouvelles Mécaniques de Combat

### Système de Moral
- Le moral affecte les performances
- Victoires consécutives = boost de moral
- Défaites = baisse de moral

### Combos d'Équipe
- Certains Shackers ont des synergies
- Bonus si utilisés ensemble
- Compétences combo spéciales

## 10. 🌍 Monde Persistant

### Carte du Monde
- Différentes régions à conquérir
- Chaque région a ses spécificités
- Bonus de territoire contrôlé

### Événements Mondiaux
- Invasions de boss
- Tournois spéciaux
- Défis communautaires

## Priorités d'Implémentation

### Phase 1 (Court terme)
1. Hub principal basique
2. Système d'entraînement simple
3. Missions quotidiennes

### Phase 2 (Moyen terme)
1. Construction de base
2. Tournois automatisés
3. Système de clan basique

### Phase 3 (Long terme)
1. Monde persistant
2. Événements saisonniers
3. Personnalisation avancée

## Notes Techniques

### Modifications Base de Données
- Nouvelles tables: Buildings, Training, Tournaments, Clans, Missions
- Extensions du modèle Shacker: experience, fatigue, morale
- Système de cache pour les données fréquentes

### Interface Utilisateur
- Nouvelle scène: HubScene (Phaser)
- UI responsive pour mobile
- Animations fluides entre les zones

### Performance
- Chargement progressif des assets
- Optimisation des requêtes DB
- Système de file d'attente pour les actions
