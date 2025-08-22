# Guide de Résolution des Problèmes de Lancement

## ✅ Serveur Backend Lancé

Le serveur backend est maintenant en cours d'exécution sur `http://localhost:4000`. Cela résout les erreurs de connexion API.

## 🔧 Pour Résoudre les Problèmes

### 1. Erreur "Invalid frameId"
Cette erreur provient d'une extension de navigateur (probablement une extension Redux DevTools ou similaire). 

**Solutions :**
- Essayez d'ouvrir le jeu dans un navigateur en mode incognito/privé
- Ou désactivez temporairement les extensions du navigateur
- Ou utilisez un autre navigateur

### 2. Lancer le Jeu Correctement

**Option A - Via le fichier batch (Recommandé) :**
```batch
LANCER_LE_JEU.bat
```

**Option B - Directement :**
1. Ouvrez `index_auto.html` dans votre navigateur
2. Ou ouvrez `http://localhost:5173` si vous utilisez Vite

**Option C - Pour tester le Hub :**
1. Ouvrez `hub.html` directement dans votre navigateur

### 3. Configuration Base de Données

Si vous n'avez pas encore configuré PostgreSQL :

1. **Installer PostgreSQL** (si pas déjà fait)
2. **Créer le fichier server/.env** avec :
   ```
   DATABASE_URL="postgresql://postgres:votre_mot_de_passe@localhost:5432/labrute?schema=public"
   JWT_SECRET="your-secret-key-here"
   PORT=4000
   ```
3. **Créer la base de données** :
   ```sql
   CREATE DATABASE labrute;
   ```
4. **Exécuter les migrations** (depuis le dossier server) :
   ```
   npm run db:migrate
   ```

### 4. Ordre de Lancement Correct

1. **Serveur Backend** (déjà lancé) :
   ```
   cd server
   npm run dev
   ```

2. **Frontend** :
   - Ouvrir `index_auto.html` dans le navigateur
   - OU lancer Vite si configuré : `npm run dev` (depuis la racine)

### 5. Vérification

- Le serveur backend doit afficher : `API listening on http://localhost:4000`
- Vous devez pouvoir accéder à `http://localhost:4000/api/health`
- Le jeu doit se charger sans erreurs de connexion

## 📝 Notes

- L'erreur "Invalid frameId" n'empêche pas le jeu de fonctionner
- Les erreurs de connexion API sont maintenant résolues
- Si vous voyez encore des erreurs, vérifiez que PostgreSQL est bien installé et configuré
