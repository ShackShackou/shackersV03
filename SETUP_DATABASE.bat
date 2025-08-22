@echo off
echo =================================
echo SETUP DATABASE LABRUTE
echo =================================
echo.

echo Etape 1: Creation de la base de donnees...
echo (Entrez le mot de passe PostgreSQL quand demande)
echo.

REM Tentative de creation de la base de donnees
psql -U postgres -c "CREATE DATABASE labrute;" 2>nul

if %errorlevel% == 0 (
    echo Base de donnees creee avec succes!
) else (
    echo Base de donnees existe deja ou erreur.
)

echo.
echo Etape 2: Lancement des migrations...
cd server
call npm run db:migrate

echo.
echo Etape 3: Lancement du serveur backend...
start cmd /k "npm run dev"

echo.
echo Etape 4: Lancement du frontend...
cd ..
start cmd /k "npm start"

echo.
echo =================================
echo SETUP TERMINE!
echo =================================
echo.
echo Frontend: http://localhost:5173
echo Backend API: http://localhost:4000
echo.
pause
