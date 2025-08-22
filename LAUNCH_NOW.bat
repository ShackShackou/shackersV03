@echo off
echo LANCEMENT DU JEU LABRUTE
echo ========================
echo.

echo [1/4] Preparation de la base de donnees SQLite...
cd server
call npx prisma generate
call npx prisma db push
echo.

echo [2/4] Lancement du serveur backend (port 4000)...
start "Backend Server" cmd /k "npm run dev"
echo Backend demarre!
echo.

echo [3/4] Attente de 5 secondes...
timeout /t 5 /nobreak > nul

echo [4/4] Lancement du frontend (port 5173)...
cd ..
start "Frontend Server" cmd /k "npm run dev"
echo Frontend demarre!
echo.

echo ========================
echo TOUT EST LANCE!
echo ========================
echo.
echo Attendez 10 secondes puis ouvrez:
echo.
echo   http://localhost:5173
echo.
echo Pages disponibles:
echo   - http://localhost:5173/quick-test.html (TEST RAPIDE)
echo   - http://localhost:5173/my-shackers.html (VOS SHACKERS)
echo   - http://localhost:5173/create-shacker.html (CREER UN SHACKER)
echo.
echo Si ca ne marche pas, fermez tout et relancez ce script.
echo.
pause
