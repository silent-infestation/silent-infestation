@echo off
setlocal enabledelayedexpansion

REM Définir le nom du conteneur PostgreSQL
set "CONTAINER_NAME=db_silen2festation"

REM Récupérer l'adresse IP du conteneur
for /f "delims=" %%i in ('docker inspect -f "{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}" %CONTAINER_NAME%') do set "DB_IP=%%i"

REM Lancer la création/recréation des conteneurs via Docker Compose
echo [INFO] Démarrage de la création/recréation des conteneurs avec Docker Compose...
docker compose -f docker-compose.dev.yml up -d --build --force-recreate
set DOCKER_EXIT_CODE=%ERRORLEVEL%
timeout /t 5 >nul

REM Vérifier si l'IP a été trouvée
if "%DB_IP%"=="" (
    echo [ERREUR] Impossible de récupérer l'IP du conteneur PostgreSQL (%CONTAINER_NAME%).
    exit /b 1
)

REM Définir le chemin du fichier .env
set "ENV_FILE=website_next\.env"

REM Création du fichier .env avec les valeurs
(
    echo # Node environment (dev, prod, test)
    echo NODE_ENV=dev
    echo.
    echo # JWT secrets
    echo JWT_SECRET=+kFroyMoHvgGbv04kF2WQSczmfpaJs+VIh4BuDfjNnmCJyQXfZzco0gJ5kJ80vMdKjl/nM8g+43c
    echo JWT_REFRESH_SECRET=7XsvAGk2YMCf+3UXBL7Ywj7Dv9jWLKgrFZVNALnokLSndhEGV2VFQA/V7RhPJxHXw9Sh2lJWE118
    echo.
    echo # Docker postgres container initialized users
    echo POSTGRES_USER=pascal_parasite
    echo POSTGRES_PASSWORD=bugman_
    echo.
    echo # Developement environment
    echo DEV_DB_NAME=dev_silen2festation
    echo.
    echo # Test environment
    echo TEST_DB_NAME=test_silen2festation
    echo.
    echo # Production environment
    echo PROD_DB_NAME=prod_silen2festation
    echo.
    echo # Database URLs
    echo DATABASE_URL=postgresql://pascal_parasite:bugman_@%DB_IP%:5432/dev_silen2festation?schema=public
    echo DATABASE_DOCKER_URL=postgresql://pascal_parasite:bugman_@%CONTAINER_NAME%:5432/dev_silen2festation?schema=public
    echo.
    echo WEBSITE_PORT=23000
) > "%ENV_FILE%"

echo [SUCCÈS] Fichier %ENV_FILE% créé avec succès !

REM Exécuter les migrations Prisma
pushd website_next
echo [INFO] Lancement des migrations Prisma...
npx prisma migrate dev --name init
set PRISMA_EXIT_CODE=%ERRORLEVEL%
popd

REM Préparation du message concernant les migrations Prisma
if %PRISMA_EXIT_CODE%==0 (
    set "MIGRATION_MSG=[SUCCÈS] Les migrations Prisma ont été exécutées avec succès."
) else (
    set "MIGRATION_MSG=[ERREUR] Une erreur est survenue lors de l'exécution des migrations Prisma. Code d'erreur: %PRISMA_EXIT_CODE%"
)

REM Message final récapitulatif dynamique
echo.
echo - Le conteneur PostgreSQL '%CONTAINER_NAME%' a fourni l'adresse IP : %DB_IP%.
echo - Le fichier .env a été généré dans le répertoire 'website_next' avec les paramètres de connexion.
echo - L'URL de connexion à la base de données est : postgresql://pascal_parasite:bugman_@%DB_IP%:5432/dev_silen2festation?schema=public.
echo - %MIGRATION_MSG%
echo.

endlocal