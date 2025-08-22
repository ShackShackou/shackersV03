@echo off
echo === LANCEMENT DU SERVEUR BACKEND ===
echo.

cd server
echo Installation des dependances...
call npm install

echo.
echo Generation Prisma...
call npx prisma generate

echo.
echo Lancement du serveur...
npm run dev

pause
