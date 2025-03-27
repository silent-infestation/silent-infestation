#!/bin/bash

# Lancer la création/recréation des conteneurs via Docker Compose
echo -e "\e[34m[INFO] Démarrage de la création/recréation des conteneurs avec Docker Compose...\e[0m"
docker compose -f docker-compose.dev.yml up -d --build --force-recreate
DOCKER_EXIT_CODE=$?

if [ $DOCKER_EXIT_CODE -ne 0 ]; then
    echo -e "\e[31m[ERREUR] La commande Docker Compose a échoué avec le code d'erreur $DOCKER_EXIT_CODE.\e[0m"
    exit 1
fi

echo -e "\e[32m[SUCCÈS] Les conteneurs ont été créés/recréés avec succès.\e[0m"

# Définir le nom du conteneur PostgreSQL
CONTAINER_NAME="db_silen2festation"

# Récupérer l'adresse IP du conteneur PostgreSQL
echo -e "\e[34m[INFO] Récupération de l'adresse IP du conteneur PostgreSQL '$CONTAINER_NAME'...\e[0m"
DB_IP=$(docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' $CONTAINER_NAME)

if [ -z "$DB_IP" ]; then
    echo -e "\e[31m[ERREUR] Impossible de récupérer l'IP du conteneur PostgreSQL ($CONTAINER_NAME).\e[0m"
    exit 1
fi

echo -e "\e[32m[SUCCÈS] Adresse IP récupérée : $DB_IP.\e[0m"

# Définir le chemin du fichier .env
ENV_FILE="website_next/.env"

# Création du répertoire si nécessaire
echo -e "\e[34m[INFO] Vérification/création du répertoire 'website_next'...\e[0m"
mkdir -p website_next

# Génération du fichier .env avec les valeurs
echo -e "\e[34m[INFO] Génération du fichier .env avec les paramètres de connexion...\e[0m"
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

echo -e "\e[32m[SUCCÈS] Fichier $ENV_FILE créé avec succès.\e[0m"

# Exécuter les migrations Prisma
sleep 1

echo -e "\e[34m[INFO] Lancement des migrations Prisma...\e[0m"
cd website_next || exit
npx prisma migrate dev --name init
PRISMA_EXIT_CODE=$?

if [ $PRISMA_EXIT_CODE -eq 0 ]; then
    MIGRATION_MSG="\e[32m[SUCCÈS] Les migrations Prisma ont été exécutées avec succès.\e[0m"
else
    MIGRATION_MSG="\e[31m[ERREUR] Une erreur est survenue lors de l'exécution des migrations Prisma. Code d'erreur: $PRISMA_EXIT_CODE\e[0m"
fi

# Message final récapitulatif dynamique
echo "- Les conteneurs ont été créés/recréés avec la commande : 'docker compose -f docker-compose.dev.yml up -d --build --force-recreate'.
- Le conteneur PostgreSQL '$CONTAINER_NAME' a fourni l'adresse IP : $DB_IP.
- Le fichier .env a été généré dans le répertoire 'website_next' avec les paramètres de connexion.
- L'URL de connexion à la base de données est : postgresql://pascal_parasite:bugman_@$DB_IP:5432/dev_silen2festation?schema=public.
- $MIGRATION_MSG
\e[0m"
