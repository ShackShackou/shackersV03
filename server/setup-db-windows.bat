@echo off
echo Test de connexion PostgreSQL...

REM Essayer avec authentification Windows
set PGPASSWORD=postgres
psql -U postgres -d postgres -c "CREATE DATABASE labrute;" 2>nul

if %errorlevel% == 0 (
    echo Base de donnees creee!
    goto :success
)

REM Essayer avec mot de passe vide
set PGPASSWORD=
psql -U postgres -d postgres -c "CREATE DATABASE labrute;" 2>nul

if %errorlevel% == 0 (
    echo Base de donnees creee!
    goto :success
)

REM Essayer avec admin
set PGPASSWORD=admin
psql -U postgres -d postgres -c "CREATE DATABASE labrute;" 2>nul

if %errorlevel% == 0 (
    echo Base de donnees creee!
    goto :success
)

echo Impossible de se connecter. Veuillez entrer votre mot de passe PostgreSQL:
set /p PGPASSWORD=Mot de passe: 
psql -U postgres -d postgres -c "CREATE DATABASE labrute;"

:success
echo Operation terminee.
pause
