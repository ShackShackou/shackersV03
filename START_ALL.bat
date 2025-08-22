@echo off
echo === DEMARRAGE DE LABRUTE REBORN ===
echo.

echo [1] Demarrage du serveur backend...
start cmd /k "cd /d %~dp0server && npm run dev"

echo [2] Attente 5 secondes...
timeout /t 5 /nobreak >nul

echo [3] Demarrage du frontend...
start cmd /k "cd /d %~dp0 && npm run dev"

echo.
echo ================================
echo SERVEURS LANCES !
echo ================================
echo.
echo Backend API: http://localhost:4000
echo Frontend: http://localhost:5173
echo.
echo Ouvrez http://localhost:5173 dans votre navigateur
echo.
pause
