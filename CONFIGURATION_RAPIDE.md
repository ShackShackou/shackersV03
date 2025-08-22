# 🚀 Configuration Rapide - LaBrute Reborn

## État Actuel ✅
- ✅ Hub et système d'entraînement créés
- ✅ Frontend fonctionne (sur http://localhost:5173)
- ❌ Backend a besoin de PostgreSQL configuré

## Pour Finir la Configuration (5 minutes)

### Option A : Sans Base de Données (Mode Démo)
Si vous voulez juste tester le Hub sans créer de compte :
1. Ouvrez directement `hub.html` dans votre navigateur
2. Les fonctionnalités de base fonctionnent en mode démo

### Option B : Configuration Complète

#### 1. Créer le fichier server/.env
Créez un nouveau fichier `server/.env` avec ce contenu :
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/labrute?schema=public"
JWT_SECRET="secret-key-123"
PORT=4000
```

#### 2. Installer PostgreSQL (si pas déjà fait)
- Téléchargez depuis : https://www.postgresql.org/download/windows/
- Installez avec le mot de passe : postgres

#### 3. Créer la base de données
Ouvrez pgAdmin ou psql et exécutez :
```sql
CREATE DATABASE labrute;
```

#### 4. Dans le terminal (dossier server) :
```bash
npm install
npm run db:migrate
npm run dev
```

## Ce Qui Est Déjà Prêt 🎮

### 1. Hub Principal (`/hub.html`)
- 5 bâtiments interactifs
- Système de ressources
- Navigation intuitive

### 2. Centre d'Entraînement
- 4 types d'entraînement
- Système de fatigue
- Progression animée

### 3. Documentation Complète
Dans `project_docs/` :
- Design complet du système
- Plan de tournois
- Roadmap détaillée

## Pour Tester Maintenant
1. Le frontend est déjà lancé sur http://localhost:5173
2. Pour le Hub : http://localhost:5173/hub.html
3. Pour le jeu normal : http://localhost:5173

## Prochaines Étapes
- Ajouter les assets graphiques
- Implémenter le système de tournois
- Créer les API de ressources
- Système de missions

Le plus gros du travail de conception est fait ! Il reste juste la configuration de la base de données pour avoir un système complet.
