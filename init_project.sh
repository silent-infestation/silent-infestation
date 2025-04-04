#!/bin/bash

# Définir le nom du conteneur PostgreSQL
CONTAINER_NAME="db_silen2festation"

# Récupérer l'adresse IP du conteneur
DB_IP=$(docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' $CONTAINER_NAME)

# Lancer la création/recréation des conteneurs via Docker Compose
echo "\e[34m[INFO] Démarrage de la création/recréation des conteneurs avec Docker Compose...\e[0m"
docker compose -f docker-compose.dev.yml up -d --build --force-recreate
DOCKER_EXIT_CODE=$?
sleep 5
# Vérifier si l'IP a été trouvée
if [ -z "$DB_IP" ]; then
    echo -e "\e[31m[ERREUR] Impossible de récupérer l'IP du conteneur PostgreSQL ($CONTAINER_NAME).\e[0m"
    exit 1
fi

# Définir le chemin du fichier .env
ENV_FILE="website_next/.env"

# Création du répertoire si nécessaire
touch $ENV_FILE
# Création du fichier .env avec les valeurs
cat <<EOF > $ENV_FILE
# Node environment (dev, prod, test)
NODE_ENV=dev

# JWT secrets
JWT_SECRET=+kFroyMoHvgGbv04kF2WQSczmfpaJs+VIh4BuDfjNnmCJyQXfZzco0gJ5kJ80vMdKjl/nM8g+43c
JWT_REFRESH_SECRET=7XsvAGk2YMCf+3UXBL7Ywj7Dv9jWLKgrFZVNALnokLSndhEGV2VFQA/V7RhPJxHXw9Sh2lJWE118

# Docker postgres container initialized users
POSTGRES_USER="pascal_parasite"
POSTGRES_PASSWORD="bugman_"

# Developement environment
DEV_DB_NAME="dev_silen2festation"

# Test environment
TEST_DB_NAME="test_silen2festation"

# Production environment
PROD_DB_NAME="prod_silen2festation"

# Database URLs
DATABASE_URL="postgresql://pascal_parasite:bugman_@$DB_IP:5432/dev_silen2festation?schema=public"
DATABASE_DOCKER_URL="postgresql://pascal_parasite:bugman_@$CONTAINER_NAME:5432/dev_silen2festation?schema=public"

WEBSITE_PORT=23000
EOF

echo -e "\e[32m[SUCCÈS] Fichier $ENV_FILE créé avec succès !\e[0m"

sleep 60

# Exécuter les migrations Prisma
# cd website_next || exit
# echo -e "\e[34m[INFO] Lancement des migrations Prisma...\e[0m"
docker exec -it website_silen2festation sh -c "npx prisma migrate dev --name init"
# exit
PRISMA_EXIT_CODE=$?

# Préparation du message concernant les migrations Prisma
if [ $PRISMA_EXIT_CODE -eq 0 ]; then
    MIGRATION_MSG="\e[32m[SUCCÈS] Les migrations Prisma ont été exécutées avec succès.\e[0m"
else
    MIGRATION_MSG="\e[31m[ERREUR] Une erreur est survenue lors de l'exécution des migrations Prisma. Code d'erreur: $PRISMA_EXIT_CODE\e[0m"
fi

# Message final récapitulatif dynamique
echo "\e[35m- Le conteneur PostgreSQL '$CONTAINER_NAME' a fourni l'adresse IP : $DB_IP.
- Le fichier .env a été généré dans le répertoire 'website_next' avec les paramètres de connexion.
- L'URL de connexion à la base de données est : postgresql://pascal_parasite:bugman_@$DB_IP:5432/dev_silen2festation?schema=public.
- $MIGRATION_MSG
\e[0m"
