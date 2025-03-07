#!/bin/bash
set -e  # Stoppe le script en cas d'erreur

echo "📂 Déploiement dans $PATH_TO_PROJECT..."

# Vérifier la présence du fichier .env (mais ne pas bloquer sur les variables passées par GitHub Actions)
if [ ! -f "$PATH_TO_PROJECT/.env" ]; then
    echo "❌ ERREUR : Le fichier .env est manquant ! Certaines variables pourraient ne pas être chargées."
    exit 1
else
    echo "✅ .env trouvé, chargement des variables..."
    export $(grep -v '^#' "$PATH_TO_PROJECT/.env" | xargs)
fi

echo "📥 Vérification et mise à jour de deploy.sh et docker-compose.prod.yml..."
git fetch origin main --quiet

# Mettre à jour uniquement deploy.sh
if git diff --name-only origin/main | grep -q "deploy.sh"; then
    echo "🔄 deploy.sh a changé, mise à jour..."
    git checkout origin/main -- deploy.sh
    chmod +x deploy.sh  # Assurer que deploy.sh reste exécutable
else
    echo "✅ deploy.sh est déjà à jour."
fi

# Mettre à jour uniquement docker-compose.prod.yml
if git diff --name-only origin/main | grep -q "docker-compose.prod.yml"; then
    echo "🔄 docker-compose.prod.yml a changé, mise à jour..."
    git checkout origin/main -- docker-compose.prod.yml
    RESTART_REQUIRED=true
else
    echo "✅ docker-compose.prod.yml est déjà à jour."
fi

echo "🐳 Connexion à Docker Hub..."
echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin

echo "📦 Vérification et pull de l'image Docker..."

# Vérifier si l'image Docker existe
if [ "$(docker images -q MYDOCKERHUBUSERNAME/silent-infestation:latest)" = "" ]; then
    echo "🚨 L'image Docker n'existe pas, pull nécessaire..."
    RESTART_REQUIRED=true
fi

echo "📦 Pull de l'image Docker..."
docker pull MYDOCKERHUBUSERNAME/silent-infestation:latest

# Vérifier si l’image est différente avant de redémarrer
if [ "$RESTART_REQUIRED" = false ] && [ "$(docker images -q MYDOCKERHUBUSERNAME/silent-infestation:latest)" != "$(docker ps -aq --filter ancestor=MYDOCKERHUBUSERNAME/silent-infestation:latest)" ]; then
    echo "📦 Nouvelle image détectée, mise à jour nécessaire..."
    RESTART_REQUIRED=true
fi

# Redémarrer uniquement si nécessaire
if [ "$RESTART_REQUIRED" = true ]; then
    echo "🔄 Redémarrage des services..."
    docker-compose -f docker-compose.prod.yml up -d --remove-orphans
else
    echo "✅ Pas de redémarrage nécessaire."
fi

echo "🎉 Déploiement terminé avec succès !"
