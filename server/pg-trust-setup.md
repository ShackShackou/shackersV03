# Configuration Alternative : Authentification par Confiance

## Solution Rapide (2 minutes)

### 1. Localiser pg_hba.conf

Le fichier se trouve généralement dans :
- `C:\Program Files\PostgreSQL\XX\data\pg_hba.conf` (où XX est la version)

### 2. Modifier pg_hba.conf

Trouvez ces lignes :
```
# IPv4 local connections:
host    all             all             127.0.0.1/32            md5
```

Remplacez temporairement `md5` par `trust` :
```
# IPv4 local connections:
host    all             all             127.0.0.1/32            trust
```

### 3. Redémarrer PostgreSQL

Dans PowerShell (en tant qu'admin) :
```powershell
Restart-Service postgresql-x64-*
```

Ou via Services Windows :
1. Win+R → services.msc
2. Trouver "postgresql-x64-XX"
3. Clic droit → Redémarrer

### 4. Mettre à jour .env

```
DATABASE_URL="postgresql://postgres@localhost:5432/labrute?schema=public"
```
(Sans mot de passe)

### 5. Après les migrations

IMPORTANT : Remettez `md5` dans pg_hba.conf et redémarrez PostgreSQL pour la sécurité.
