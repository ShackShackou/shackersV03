# 🚀 GUIDE DE DÉMARRAGE RAPIDE - LABRUTE REBORN

## ⚡ LANCEMENT AUTOMATIQUE (RECOMMANDÉ)

Double-cliquez sur:
```
LANCER_TOUT_MAINTENANT.bat
```

Cela va automatiquement:
1. Générer Prisma et la base de données
2. Lancer le serveur backend (port 4000)
3. Lancer le serveur frontend (port 5174)
4. Ouvrir la page principale dans votre navigateur

## 📍 PAGES DU JEU

- **PAGE PRINCIPALE**: http://localhost:5174/home.html
- Combat aléatoire: http://localhost:5174/random-fight.html
- Créer un personnage: http://localhost:5174/create-shacker.html
- Mes personnages: http://localhost:5174/my-shackers.html
- Sélection adversaire: http://localhost:5174/select-opponent.html

## 🔧 LANCEMENT MANUEL (si le .bat ne fonctionne pas)

### 1. Backend (dans le dossier /server)
```bash
cd server
npx prisma generate
npx prisma db push
npm run dev
```

### 2. Frontend (à la racine du projet)
```bash
npm run dev
```

### 3. Ouvrir dans le navigateur
```
http://localhost:5174/home.html
```

## ⚠️ PORTS UTILISÉS

- **Frontend**: 5174 (parfois 5173 si libre)
- **Backend**: 4000
- **Base de données**: SQLite locale

## 🔑 COMPTE DE TEST

- Email: test@test.com
- Mot de passe: test123

## 🆘 EN CAS DE PROBLÈME

1. Fermez tous les terminaux
2. Tuez les processus Node.js dans le gestionnaire de tâches
3. Relancez LANCER_TOUT_MAINTENANT.bat
4. Si le port 5173 est pris, essayez 5174

## 💡 ASTUCE

Gardez ce fichier ouvert pendant le développement pour référence rapide!