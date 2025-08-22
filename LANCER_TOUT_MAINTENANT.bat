@echo off
title LABRUTE LAUNCHER
color 0A
cls

echo ========================================
echo     LANCEMENT AUTOMATIQUE LABRUTE
echo ========================================
echo.

:: Aller dans le dossier server
cd /d "C:\Users\thesh\OneDrive\Documents\CODES\__ROSEBUD-AI-LABRUTE\LaBrute RebornV06 - Copy\server"

echo [1/5] Generation Prisma...
call npx prisma generate 2>nul
echo OK
echo.

echo [2/5] Creation base de donnees SQLite...
call npx prisma db push 2>nul
echo OK
echo.

echo [3/5] Lancement Backend (port 4000)...
start "Backend LaBrute" /min cmd /c "cd /d C:\Users\thesh\OneDrive\Documents\CODES\__ROSEBUD-AI-LABRUTE\LaBrute RebornV06 - Copy\server && npm run dev"
echo Backend lance!
echo.

:: Attendre 5 secondes
ping 127.0.0.1 -n 6 > nul

echo [4/5] Lancement Frontend (port 5173)...
start "Frontend LaBrute" /min cmd /c "cd /d C:\Users\thesh\OneDrive\Documents\CODES\__ROSEBUD-AI-LABRUTE\LaBrute RebornV06 - Copy && npm run dev"
echo Frontend lance!
echo.

:: Attendre 5 secondes
ping 127.0.0.1 -n 6 > nul

echo [5/5] Ouverture du navigateur...
start http://localhost:5173/quick-test.html
echo.

echo ========================================
echo     TOUT EST LANCE !
echo ========================================
echo.
echo COMPTE TEST:
echo   Email: test@test.com
echo   Pass:  test123
echo.
echo PAGES DISPONIBLES:
echo   http://localhost:5173/quick-test.html
echo   http://localhost:5173/my-shackers.html
echo   http://localhost:5173/create-shacker.html
echo.
echo Si ca ne marche pas:
echo   1. Fermez tout
echo   2. Relancez ce script
echo.
pause
