@echo off
echo Test de connexion PostgreSQL...
echo.

set PGPASSWORD=010582
psql -U postgres -h localhost -p 5432 -d postgres -c "SELECT version();" 2>error.txt

if %errorlevel% == 0 (
    echo Connexion reussie!
    echo Creation de la base de donnees...
    psql -U postgres -h localhost -p 5432 -c "CREATE DATABASE labrute;"
    echo Termine!
) else (
    echo ERREUR: Impossible de se connecter
    echo.
    type error.txt
    echo.
    echo Verifiez que:
    echo 1. PostgreSQL est demarre
    echo 2. Le mot de passe est correct
    echo 3. L'utilisateur est bien 'postgres'
)

pause
