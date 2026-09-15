#!/bin/bash
set -e

echo "======================================"
echo "  Setup Bot de Trading Forex"
echo "  Ubuntu 22.04"
echo "======================================"

# Verifier qu'on tourne en root ou avec sudo
if [ "$EUID" -ne 0 ]; then
    echo "Ce script doit etre execute avec sudo"
    echo "Usage: sudo bash scripts/setup.sh"
    exit 1
fi

# Mise a jour du systeme
echo "[1/6] Mise a jour du systeme..."
apt-get update -qq
apt-get upgrade -y -qq

# Installer les dependances de base
echo "[2/6] Installation des dependances systeme..."
apt-get install -y -qq \
    curl \
    wget \
    git \
    ca-certificates \
    gnupg \
    lsb-release \
    apt-transport-https \
    software-properties-common

# Installer Docker
echo "[3/6] Installation de Docker..."
if ! command -v docker &> /dev/null; then
    # Ajouter la cle GPG officielle de Docker
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
        gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg

    # Ajouter le depot Docker
    echo \
        "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
        https://download.docker.com/linux/ubuntu \
        $(lsb_release -cs) stable" | \
        tee /etc/apt/sources.list.d/docker.list > /dev/null

    apt-get update -qq
    apt-get install -y -qq \
        docker-ce \
        docker-ce-cli \
        containerd.io \
        docker-buildx-plugin \
        docker-compose-plugin

    # Activer et demarrer Docker
    systemctl enable docker
    systemctl start docker

    echo "Docker installe: $(docker --version)"
else
    echo "Docker deja installe: $(docker --version)"
fi

# Installer Docker Compose (standalone)
echo "[4/6] Installation de Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    COMPOSE_VERSION="2.23.3"
    curl -fsSL \
        "https://github.com/docker/compose/releases/download/v${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" \
        -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    echo "Docker Compose installe: $(docker-compose --version)"
else
    echo "Docker Compose deja installe: $(docker-compose --version)"
fi

# Ajouter l'utilisateur courant au groupe docker (si pas root)
REAL_USER="${SUDO_USER:-$USER}"
if [ "$REAL_USER" != "root" ]; then
    usermod -aG docker "$REAL_USER"
    echo "Utilisateur '$REAL_USER' ajoute au groupe docker"
fi

# Configurer l'environnement du projet
echo "[5/6] Configuration du projet..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

# Creer les dossiers necessaires
mkdir -p data
chmod 755 data

# Copier .env.example si .env n'existe pas
if [ ! -f .env ]; then
    cp .env.example .env
    echo "Fichier .env cree depuis .env.example"
    echo ""
    echo "IMPORTANT: Editez .env avec vos vraies valeurs:"
    echo "  - OANDA_API_KEY et OANDA_ACCOUNT_ID"
    echo "  - SECRET_KEY (changez la valeur par defaut!)"
    echo "  - Parametres email/Telegram (optionnel)"
else
    echo "Fichier .env deja present (non modifie)"
fi

# Rendre les scripts executables
chmod +x scripts/*.sh

echo "[6/6] Verification de l'installation..."
docker --version
docker-compose --version

echo ""
echo "======================================"
echo "  Installation terminee!"
echo "======================================"
echo ""
echo "Prochaines etapes:"
echo "  1. Editez .env avec votre cle OANDA:"
echo "     nano .env"
echo ""
echo "  2. Demarrez le bot:"
echo "     ./scripts/start.sh"
echo ""
echo "  3. Ouvrez le dashboard:"
echo "     http://localhost"
echo ""
if [ "$REAL_USER" != "root" ]; then
    echo "NOTE: Reconnectez-vous ou executez 'newgrp docker'"
    echo "      pour que les permissions Docker prennent effet"
fi
