@echo off
echo === LANCEMENT DU FRONTEND ===
echo.

echo Installation des dependances...
call npm install

echo.
echo Lancement du frontend...
npm run dev

pause
