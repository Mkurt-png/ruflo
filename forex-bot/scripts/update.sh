#!/bin/bash
set -e
# ==========================================================
# Mise à jour du bot (sans interruption prolongée)
# Usage: sudo bash scripts/update.sh
# ==========================================================

CYAN='\033[0;36m'; GREEN='\033[0;32m'; NC='\033[0m'
log() { echo -e "${CYAN}[INFO]${NC}  $1"; }
ok()  { echo -e "${GREEN}[OK]${NC}    $1"; }

cd "$(dirname "$0")/.."
log "Récupération des dernières modifications..."
git pull origin main

log "Reconstruction et redémarrage des conteneurs..."
docker-compose pull --quiet
docker-compose up -d --build --remove-orphans

ok "Bot mis à jour et redémarré"
docker-compose ps
