@echo off
cls
echo ========================================
echo    CONFIGURATION AUTOMATIQUE LABRUTE    
echo ========================================
echo.
echo Ce script va configurer votre jeu automatiquement.
echo.
echo ETAPE 1: Entrez votre mot de passe PostgreSQL
echo (C'est le mot de passe que vous avez defini lors de l'installation de PostgreSQL)
echo.
set /p PG_PASSWORD=Mot de passe PostgreSQL: 

echo.
echo ETAPE 2: Creation du fichier de configuration...

cd server
echo DATABASE_URL="postgresql://postgres:%PG_PASSWORD%@localhost:5432/labrute?schema=public" > .env
echo JWT_SECRET="your-secret-key-here-change-in-production" >> .env
echo PORT=4000 >> .env

echo Configuration creee!

echo.
echo ETAPE 3: Test de connexion et creation de la base...
set PGPASSWORD=%PG_PASSWORD%
psql -U postgres -c "CREATE DATABASE labrute;" 2>nul

if %errorlevel% == 0 (
    echo Base de donnees creee avec succes!
) else (
    echo Base de donnees existe deja ou erreur.
)

echo.
echo ETAPE 4: Installation des dependances...
call npm install

echo.
echo ETAPE 5: Generation du client Prisma...
call npm run db:generate

echo.
echo ETAPE 6: Migration de la base de donnees...
call npm run db:migrate

if %errorlevel% == 0 (
    echo.
    echo ========================================
    echo    CONFIGURATION TERMINEE AVEC SUCCES!  
    echo ========================================
    echo.
    echo Le jeu est pret a etre lance!
    echo.
    echo Pour lancer le jeu:
    echo 1. Terminal 1: cd server && npm run dev
    echo 2. Terminal 2: npm start
    echo 3. Ouvrir: http://localhost:5173
    echo.
) else (
    echo.
    echo ========================================
    echo         ERREUR DE CONFIGURATION        
    echo ========================================
    echo.
    echo Verifiez que:
    echo - PostgreSQL est installe et demarre
    echo - Le mot de passe est correct
    echo - Le port 5432 est disponible
    echo.
)

pause
