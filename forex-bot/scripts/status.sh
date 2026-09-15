#!/bin/bash
# ==========================================================
# Affiche l'état complet du bot
# Usage: bash scripts/status.sh
# ==========================================================

CYAN='\033[0;36m'; GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; NC='\033[0m'

cd "$(dirname "$0")/.."

echo ""
echo "========================================"
echo "   🤖 Statut du Bot de Trading Forex"
echo "========================================"
echo ""

# Conteneurs Docker
echo "📦 Conteneurs:"
docker-compose ps 2>/dev/null || echo "  Docker Compose non disponible"
echo ""

# Santé du backend
echo "🔌 Backend API:"
if curl -sf http://localhost:8000/health >/dev/null 2>&1; then
    HEALTH=$(curl -s http://localhost:8000/health)
    echo -e "  ${GREEN}● En ligne${NC} — $HEALTH"
else
    echo -e "  ${RED}● Hors ligne${NC}"
fi
echo ""

# Redis
echo "🗄️  Redis:"
if docker-compose exec -T redis redis-cli ping 2>/dev/null | grep -q PONG; then
    echo -e "  ${GREEN}● En ligne${NC}"
else
    echo -e "  ${RED}● Hors ligne${NC}"
fi
echo ""

# Espace disque
echo "💾 Espace disque:"
df -h . | tail -1 | awk '{printf "  Utilisé: %s / %s (%s)\n", $3, $2, $5}'
echo ""

# Logs récents
echo "📋 Derniers logs backend (10 lignes):"
docker-compose logs --tail=10 backend 2>/dev/null || echo "  Aucun log disponible"
echo ""
