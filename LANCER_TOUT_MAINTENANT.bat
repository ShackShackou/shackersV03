@echo off
echo ========================================
echo   LABRUTE REBORN - LANCEMENT AUTOMATIQUE
echo ========================================
echo.

:: Couleurs pour le terminal
color 0A

:: Aller dans le dossier server
echo [1/4] Configuration de la base de donnees...
cd server
call npx prisma generate
call npx prisma db push
echo Base de donnees configuree !
echo.

:: Lancer le serveur backend
echo [2/4] Demarrage du serveur backend (port 4000)...
start "Backend Server" cmd /k "npm run dev"
echo Backend demarre !
echo.

:: Revenir à la racine et lancer le frontend
cd ..
echo [3/4] Demarrage du serveur frontend (port 5174)...
start "Frontend Server" cmd /k "npm run dev"
echo Frontend demarre !
echo.

:: Attendre un peu que les serveurs démarrent
echo [4/4] Attente du demarrage des serveurs...
timeout /t 5 /nobreak > nul

:: Ouvrir le navigateur
echo.
echo ========================================
echo   OUVERTURE DU JEU DANS LE NAVIGATEUR
echo ========================================
start http://localhost:5174/home.html

echo.
echo ========================================
echo   LE JEU EST LANCE !
echo ========================================
echo.
echo Pages disponibles:
echo - Page principale: http://localhost:5174/home.html
echo - Mes Shackers: http://localhost:5174/my-shackers.html
echo - Combat aleatoire: http://localhost:5174/random-fight.html
echo - Creer un Shacker: http://localhost:5174/create-shacker.html
echo.
echo Compte de test:
echo - Email: test@test.com
echo - Mot de passe: test123
echo.
echo Appuyez sur une touche pour fermer cette fenetre...
pause > nul
