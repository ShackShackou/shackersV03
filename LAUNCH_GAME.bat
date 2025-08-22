@echo off
echo === LANCEMENT DE LABRUTE REBORN ===
echo.

echo [1/3] Lancement du serveur backend...
cd server
start cmd /k npm run dev

echo [2/3] Attente 5 secondes...
timeout /t 5 /nobreak > nul

echo [3/3] Lancement du frontend...
cd ..
start cmd /k npm run dev

echo.
echo ====================================
echo TOUT EST LANCE !
echo ====================================
echo.
echo Backend: http://localhost:4000
echo Frontend: http://localhost:5173
echo.
echo Ouvrez http://localhost:5173 dans votre navigateur
echo.
pause
