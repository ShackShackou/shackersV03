# ⚠️ IMPORTANT : Créez le fichier .env

## Le problème
Le serveur ne peut pas démarrer car il manque le fichier de configuration `.env`

## Solution rapide (2 minutes)

### Étape 1 : Créer le fichier .env

1. Ouvrez l'Explorateur Windows
2. Naviguez vers : `C:\Users\thesh\OneDrive\Documents\CODES\__ROSEBUD-AI-LABRUTE\LaBrute RebornV06\server\`
3. Créez un nouveau fichier texte
4. Renommez-le EXACTEMENT en : `.env` (avec le point au début, sans extension .txt)

### Étape 2 : Ajouter le contenu

Ouvrez le fichier `.env` avec Notepad et collez exactement ceci :

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/labrute?schema=public"
JWT_SECRET="your-secret-key-here-change-in-production"
PORT=4000
```

### Étape 3 : Sauvegarder et relancer

1. Sauvegardez le fichier
2. Dans le terminal PowerShell (dossier server), faites Ctrl+C pour arrêter
3. Relancez avec : `npm run dev`

## Si Windows refuse de créer .env

### Méthode alternative :
1. Ouvrez PowerShell dans le dossier server
2. Tapez : `echo 'DATABASE_URL="postgresql://postgres:postgres@localhost:5432/labrute?schema=public"' > .env`
3. Tapez : `echo 'JWT_SECRET="your-secret-key-here"' >> .env`
4. Tapez : `echo 'PORT=4000' >> .env`

## Vérification
Le serveur devrait maintenant afficher quelque chose comme :
```
API listening on http://localhost:4000
Database connected successfully
```

## ⚠️ Si vous avez toujours des erreurs
C'est que PostgreSQL n'est pas installé. Dans ce cas, suivez le guide `GUIDE_INSTALLATION_POSTGRESQL.md`
