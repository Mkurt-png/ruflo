#!/bin/bash
set -e

echo "Demarrage du Bot de Trading Forex"
echo "======================================"

# Verifier .env
if [ ! -f .env ]; then
    echo "ERREUR: Fichier .env manquant!"
    echo "   Copiez .env.example vers .env et configurez vos cles"
    exit 1
fi

# Verifier Docker
if ! command -v docker &> /dev/null; then
    echo "ERREUR: Docker n'est pas installe"
    echo "   Lancez scripts/setup.sh pour l'installer"
    exit 1
fi

# Verifier Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "ERREUR: Docker Compose n'est pas installe"
    exit 1
fi

# Creer les dossiers necessaires
mkdir -p data

# Demarrer avec Docker Compose
echo "Demarrage des conteneurs..."
docker-compose up -d --build

# Attendre que le backend soit pret
echo "Attente du demarrage du backend..."
MAX_RETRIES=30
RETRY=0
until curl -sf http://localhost:8000/health > /dev/null 2>&1; do
    RETRY=$((RETRY + 1))
    if [ $RETRY -ge $MAX_RETRIES ]; then
        echo "ERREUR: Le backend n'a pas demarré dans les temps"
        docker-compose logs backend
        exit 1
    fi
    sleep 2
done

echo ""
echo "Bot demarre avec succes!"
echo "   Dashboard: http://localhost"
echo "   API:       http://localhost:8000"
echo "   Docs API:  http://localhost:8000/docs"
echo ""
echo "Logs en temps reel: docker-compose logs -f"
echo "Pour arreter:       ./scripts/stop.sh"
