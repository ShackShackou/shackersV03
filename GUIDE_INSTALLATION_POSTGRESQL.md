# 🐘 Guide d'Installation PostgreSQL pour LaBrute Reborn

## Étape 1 : Télécharger PostgreSQL

1. Allez sur : https://www.postgresql.org/download/windows/
2. Cliquez sur "Download the installer"
3. Choisissez la version Windows x86-64 (dernière version stable, ex: 16.x)
4. Téléchargez l'installateur (~300 MB)

## Étape 2 : Installer PostgreSQL

1. **Lancez l'installateur** en tant qu'administrateur

2. **Suivez l'assistant d'installation** :
   - ✅ PostgreSQL Server
   - ✅ pgAdmin 4
   - ✅ Stack Builder (optionnel)
   - ✅ Command Line Tools

3. **Configuration importante** :
   - 📁 Installation Directory : Laissez par défaut
   - 📁 Data Directory : Laissez par défaut
   - 🔑 **Password** : Entrez `postgres` (IMPORTANT: notez ce mot de passe!)
   - 🔌 Port : **5432** (par défaut)
   - 🌐 Locale : Laissez par défaut

4. **Terminez l'installation** (5-10 minutes)

## Étape 3 : Créer le fichier .env

1. Dans le dossier `server/`, créez un nouveau fichier nommé `.env` (sans extension)
2. Copiez ce contenu exact :
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/labrute?schema=public"
JWT_SECRET="your-secret-key-here-change-in-production"
PORT=4000
```

⚠️ **Note** : Si vous avez choisi un autre mot de passe, remplacez le deuxième `postgres` dans DATABASE_URL

## Étape 4 : Créer la base de données

### Option A : Avec pgAdmin (Interface graphique)
1. Ouvrez **pgAdmin 4** (installé avec PostgreSQL)
2. Entrez le mot de passe master (créez-en un si première fois)
3. Cliquez sur Servers > PostgreSQL 16 > Entrez le mot de passe `postgres`
4. Clic droit sur "Databases" > Create > Database
5. Name: `labrute`
6. Cliquez "Save"

### Option B : Avec la ligne de commande
1. Ouvrez **SQL Shell (psql)** depuis le menu Windows
2. Appuyez Enter pour tout sauf :
   - Password: `postgres`
3. Tapez : `CREATE DATABASE labrute;`
4. Tapez : `\q` pour quitter

## Étape 5 : Finaliser l'installation

Dans le terminal PowerShell (dossier server) :

```powershell
# 1. Installer les dépendances
npm install

# 2. Générer le client Prisma
npm run db:generate

# 3. Exécuter les migrations
npm run db:migrate

# 4. Lancer le serveur
npm run dev
```

## Vérification ✅

Si tout fonctionne, vous devriez voir :
```
[nodemon] starting `ts-node src/server.ts`
API listening on http://localhost:4000
```

## En cas de problème 🔧

### Erreur "ECONNREFUSED"
- Vérifiez que PostgreSQL est démarré dans Services Windows
- Service name: "postgresql-x64-16" (ou version installée)

### Erreur "authentication failed"
- Vérifiez le mot de passe dans .env
- Réinitialisez le mot de passe dans pgAdmin si besoin

### Erreur "database labrute does not exist"
- Créez la base de données avec pgAdmin ou psql

## Test Final 🎮

1. Ouvrez http://localhost:5173
2. Créez un compte
3. Connectez-vous
4. Accédez au Hub !

---

💡 **Conseil** : Gardez pgAdmin ouvert pour voir vos données en temps réel !
