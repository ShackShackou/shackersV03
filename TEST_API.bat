@echo off
echo Test de l'API...
echo.

curl http://localhost:4000/api/health
echo.
echo.

echo Si vous voyez une erreur ci-dessus, le serveur backend n'est pas lance.
echo.
pause
