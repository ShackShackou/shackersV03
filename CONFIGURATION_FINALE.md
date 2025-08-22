# 🔧 Configuration Finale - 2 Options

## Option 1 : Vérifier votre mot de passe PostgreSQL

1. **Ouvrez pgAdmin 4** (installé avec PostgreSQL)
2. **Essayez de vous connecter** avec le mot de passe `010582`
3. **Si ça ne marche pas**, notez le bon mot de passe

## Option 2 : Utiliser SQLite (Sans PostgreSQL)

Si vous voulez juste tester le jeu rapidement :

1. **Créez un fichier** `server/.env` avec ce contenu :
```
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key-here"
PORT=4000
```

2. **Dans PowerShell** (dossier server) :
```
npm run db:generate
npx prisma migrate dev --name init --schema prisma/schema-sqlite.prisma
npm run dev
```

## Option 3 : Réinitialiser PostgreSQL

1. **Ouvrez SQL Shell (psql)** depuis le menu Windows
2. **Connectez-vous** avec votre mot de passe actuel
3. **Changez le mot de passe** :
```sql
ALTER USER postgres PASSWORD '010582';
```

## Que faire maintenant ?

**DITES-MOI :**
1. Est-ce que `010582` est bien votre mot de passe PostgreSQL ?
2. Voulez-vous utiliser SQLite temporairement ?
3. Avez-vous un autre mot de passe à essayer ?

Le jeu est prêt, il nous faut juste résoudre ce problème de base de données !
