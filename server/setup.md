# Configuration du Serveur Backend

## 1. Créer le fichier .env

Créez un fichier `.env` dans le dossier `server/` avec le contenu suivant :

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/shackers?schema=public"
JWT_SECRET="your-secret-key-here-change-in-production"
PORT=4000
```

**Note**: Remplacez `postgres:postgres` par `votre_utilisateur:votre_mot_de_passe` PostgreSQL

## 2. Vérifier PostgreSQL

Assurez-vous que PostgreSQL est installé et en cours d'exécution :
- Windows : Vérifiez dans Services que "postgresql-x64-XX" est démarré
- Ou utilisez pgAdmin pour vérifier la connexion

## 3. Créer la base de données

Dans pgAdmin ou psql :
```sql
CREATE DATABASE shackers;
```

## 4. Installer les dépendances et migrer

```bash
cd server
npm install
npx prisma generate
npm run db:migrate
```

## 5. Lancer le serveur

```bash
npm run dev
```

Le serveur devrait afficher : "API listening on http://localhost:4000"
