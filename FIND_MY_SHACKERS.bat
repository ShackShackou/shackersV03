@echo off
echo =====================================
echo    RECHERCHE DE VOS SHACKERS
echo =====================================
echo.

cd server

echo 1. Generation du client Prisma...
call npx prisma generate
echo.

echo 2. Synchronisation de la base de donnees...
call npx prisma db push
echo.

echo 3. Verification des shackers...
call node init-database.js
echo.

echo =====================================
echo    LANCEMENT DU JEU
echo =====================================
echo.

echo Lancement du serveur backend...
start cmd /k "cd server && npm run dev"

timeout /t 5 /nobreak > nul

echo Lancement du frontend...
cd ..
start cmd /k "npm run dev"

echo.
echo =====================================
echo    INSTRUCTIONS
echo =====================================
echo.
echo 1. Attendez 10 secondes que les serveurs demarrent
echo 2. Ouvrez votre navigateur sur: http://localhost:5173
echo 3. Connectez-vous ou creez un compte
echo 4. Allez sur "Mes Shackers" pour voir vos combattants
echo 5. Si vous n'en avez pas, creez-en un nouveau!
echo.
echo Si ca ne marche toujours pas:
echo - Verifiez que Node.js est installe
echo - Relancez ce script
echo.
pause
