@echo off
echo Lancement de LaBrute Reborn...
echo.

echo 1. Lancement du serveur backend...
cd server
start cmd /k "npm run dev"

echo 2. Attente du demarrage du serveur...
timeout /t 5 /nobreak

echo 3. Lancement du frontend...
cd ..
start cmd /k "npm start"

echo.
echo ====================================
echo Tout est lance !
echo ====================================
echo.
echo Frontend: http://localhost:5173
echo Backend: http://localhost:4000
echo.
echo Attendez 10 secondes puis ouvrez http://localhost:5173
echo.
pause
