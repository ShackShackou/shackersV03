# 🔐 Corriger le Mot de Passe PostgreSQL

## Le Problème
L'authentification échoue car le mot de passe dans `.env` ne correspond pas à votre installation PostgreSQL.

## Solution Rapide

### 1. Ouvrez le fichier `.env`
Naviguez vers : `server/.env`

### 2. Modifiez la ligne DATABASE_URL

**Actuellement :**
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/labrute?schema=public"
```

**Remplacez par :**
```
DATABASE_URL="postgresql://postgres:VOTRE_MOT_DE_PASSE@localhost:5432/labrute?schema=public"
```

### 3. Exemples de modifications

Si votre mot de passe est `admin123` :
```
DATABASE_URL="postgresql://postgres:admin123@localhost:5432/labrute?schema=public"
```

Si votre mot de passe est `password` :
```
DATABASE_URL="postgresql://postgres:password@localhost:5432/labrute?schema=public"
```

### 4. Après modification

1. Sauvegardez le fichier
2. Dans le terminal, relancez : `npm run db:migrate`

## Si vous ne connaissez pas votre mot de passe

### Option 1 : Réinitialiser le mot de passe
1. Ouvrez pgAdmin
2. Connectez-vous avec votre mot de passe actuel
3. Changez le mot de passe de l'utilisateur postgres

### Option 2 : Utiliser un autre utilisateur
Si vous avez créé un autre utilisateur PostgreSQL, utilisez-le :
```
DATABASE_URL="postgresql://votre_user:votre_password@localhost:5432/labrute?schema=public"
```

## Vérification
Une fois le bon mot de passe configuré, `npm run db:migrate` devrait afficher :
```
Your database is now in sync with your schema.
```
