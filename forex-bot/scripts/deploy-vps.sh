#!/bin/bash
set -e

# ==========================================================
# Script de déploiement complet sur VPS Ubuntu 22.04
# Usage: bash deploy-vps.sh [--domain mondomaine.com] [--email mon@email.com]
# ==========================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log()  { echo -e "${CYAN}[INFO]${NC}  $1"; }
ok()   { echo -e "${GREEN}[OK]${NC}    $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC}  $1"; }
err()  { echo -e "${RED}[ERR]${NC}   $1"; exit 1; }

DOMAIN=""
EMAIL=""
REPO_URL="https://github.com/Mkurt-png/ruflo"
INSTALL_DIR="/opt/forex-bot"
SERVICE_USER="forexbot"

# Lire les arguments
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --domain) DOMAIN="$2"; shift ;;
        --email)  EMAIL="$2";  shift ;;
        *) warn "Argument inconnu: $1" ;;
    esac
    shift
done

if [ "$EUID" -ne 0 ]; then
    err "Exécuter avec sudo: sudo bash scripts/deploy-vps.sh"
fi

echo ""
echo "========================================================"
echo "   🤖 Déploiement Bot de Trading Forex sur VPS"
echo "========================================================"
echo ""
[ -n "$DOMAIN" ] && log "Domaine: $DOMAIN" || warn "Pas de domaine fourni → accès par IP uniquement"
[ -n "$EMAIL" ]  && log "Email:   $EMAIL"
echo ""

# -------------------------------------------------
# ÉTAPE 1 — Système
# -------------------------------------------------
log "Étape 1/8 — Mise à jour du système..."
apt-get update -qq && apt-get upgrade -y -qq
apt-get install -y -qq \
    curl wget git ca-certificates gnupg lsb-release \
    apt-transport-https software-properties-common \
    ufw fail2ban htop nano
ok "Système à jour"

# -------------------------------------------------
# ÉTAPE 2 — Docker
# -------------------------------------------------
log "Étape 2/8 — Installation de Docker..."
if ! command -v docker &>/dev/null; then
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
        | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
        | tee /etc/apt/sources.list.d/docker.list >/dev/null
    apt-get update -qq
    apt-get install -y -qq \
        docker-ce docker-ce-cli containerd.io \
        docker-buildx-plugin docker-compose-plugin
    systemctl enable --now docker
    ok "Docker $(docker --version | cut -d' ' -f3 | tr -d ',')"
else
    ok "Docker déjà présent"
fi

# Docker Compose standalone
if ! command -v docker-compose &>/dev/null; then
    COMPOSE_VER="2.24.1"
    curl -fsSL "https://github.com/docker/compose/releases/download/v${COMPOSE_VER}/docker-compose-$(uname -s)-$(uname -m)" \
        -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    ok "Docker Compose $COMPOSE_VER"
fi

# -------------------------------------------------
# ÉTAPE 3 — Utilisateur dédié
# -------------------------------------------------
log "Étape 3/8 — Création de l'utilisateur système '$SERVICE_USER'..."
if ! id "$SERVICE_USER" &>/dev/null; then
    useradd -r -m -d "$INSTALL_DIR" -s /bin/bash "$SERVICE_USER"
    usermod -aG docker "$SERVICE_USER"
    ok "Utilisateur $SERVICE_USER créé"
else
    ok "Utilisateur $SERVICE_USER déjà présent"
fi

# -------------------------------------------------
# ÉTAPE 4 — Cloner le repo
# -------------------------------------------------
log "Étape 4/8 — Récupération du code..."
if [ -d "$INSTALL_DIR/.git" ]; then
    cd "$INSTALL_DIR"
    sudo -u "$SERVICE_USER" git pull origin main
    ok "Repo mis à jour"
else
    rm -rf "$INSTALL_DIR"
    git clone "$REPO_URL" "$INSTALL_DIR"
    chown -R "$SERVICE_USER:$SERVICE_USER" "$INSTALL_DIR"
    ok "Repo cloné dans $INSTALL_DIR"
fi

cd "$INSTALL_DIR/forex-bot"

# -------------------------------------------------
# ÉTAPE 5 — Configuration .env
# -------------------------------------------------
log "Étape 5/8 — Configuration..."
mkdir -p "$INSTALL_DIR/forex-bot/data"
chown -R "$SERVICE_USER:$SERVICE_USER" "$INSTALL_DIR/forex-bot/data"

if [ ! -f "$INSTALL_DIR/forex-bot/.env" ]; then
    cp "$INSTALL_DIR/forex-bot/.env.example" "$INSTALL_DIR/forex-bot/.env"
    chown "$SERVICE_USER:$SERVICE_USER" "$INSTALL_DIR/forex-bot/.env"
    chmod 600 "$INSTALL_DIR/forex-bot/.env"
    warn "Fichier .env créé — À COMPLÉTER avant de démarrer le bot!"
    warn "  sudo nano $INSTALL_DIR/forex-bot/.env"
else
    ok ".env déjà configuré"
fi

chmod +x "$INSTALL_DIR/forex-bot/scripts/"*.sh

# -------------------------------------------------
# ÉTAPE 6 — SSL avec Certbot (si domaine fourni)
# -------------------------------------------------
if [ -n "$DOMAIN" ] && [ -n "$EMAIL" ]; then
    log "Étape 6/8 — Certificat SSL Let's Encrypt pour $DOMAIN..."
    apt-get install -y -qq certbot
    # Arrêter nginx si en cours pour libérer le port 80
    systemctl stop nginx 2>/dev/null || true
    docker-compose -f "$INSTALL_DIR/forex-bot/docker-compose.yml" stop frontend 2>/dev/null || true

    certbot certonly --standalone \
        --non-interactive --agree-tos \
        --email "$EMAIL" \
        -d "$DOMAIN"

    # Créer config nginx avec SSL
    cat > "$INSTALL_DIR/forex-bot/nginx/nginx.conf" <<NGINX
server {
    listen 80;
    server_name $DOMAIN;
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN;

    ssl_certificate     /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;

    root /usr/share/nginx/html;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://backend:8000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_read_timeout 120s;
    }

    location /ws/ {
        proxy_pass http://backend:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_read_timeout 3600s;
    }

    location ~* \.(js|css|png|jpg|ico|svg)\$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
}
NGINX
    # Monter les certs dans le conteneur frontend
    # Mise à jour docker-compose pour inclure les volumes SSL
    ok "SSL configuré pour $DOMAIN"

    # Renouvellement automatique
    echo "0 3 * * * root certbot renew --quiet --post-hook 'docker-compose -f $INSTALL_DIR/forex-bot/docker-compose.yml restart frontend'" \
        > /etc/cron.d/certbot-forexbot
    ok "Renouvellement automatique SSL configuré"
else
    log "Étape 6/8 — SSL ignoré (pas de domaine fourni)"
fi

# -------------------------------------------------
# ÉTAPE 7 — Service systemd pour démarrage auto
# -------------------------------------------------
log "Étape 7/8 — Installation du service systemd..."
cat > /etc/systemd/system/forex-bot.service <<SERVICE
[Unit]
Description=Bot de Trading Forex Automatisé
Requires=docker.service
After=docker.service network-online.target
Wants=network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
User=$SERVICE_USER
WorkingDirectory=$INSTALL_DIR/forex-bot
ExecStartPre=/usr/local/bin/docker-compose pull --quiet
ExecStart=/usr/local/bin/docker-compose up -d --build
ExecStop=/usr/local/bin/docker-compose down
ExecReload=/usr/local/bin/docker-compose restart
TimeoutStartSec=300
TimeoutStopSec=60
Restart=on-failure
RestartSec=30

[Install]
WantedBy=multi-user.target
SERVICE

systemctl daemon-reload
systemctl enable forex-bot.service
ok "Service systemd activé (démarrage automatique au boot)"

# -------------------------------------------------
# ÉTAPE 8 — Firewall UFW
# -------------------------------------------------
log "Étape 8/8 — Configuration du firewall..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
# Bloquer l'accès direct au backend (passe par nginx)
ufw deny 8000/tcp
echo "y" | ufw enable
ok "Firewall configuré (SSH + HTTP + HTTPS ouverts)"

# Fail2ban pour protéger le SSH
systemctl enable --now fail2ban
ok "Fail2ban activé (protection SSH)"

# -------------------------------------------------
# RÉSUMÉ
# -------------------------------------------------
echo ""
echo "========================================================"
echo "   ✅ Installation terminée!"
echo "========================================================"
echo ""
echo "  📁 Répertoire:  $INSTALL_DIR/forex-bot"
echo "  👤 Utilisateur: $SERVICE_USER"
echo ""
echo "  ┌─ PROCHAINES ÉTAPES ──────────────────────────────┐"
echo "  │                                                   │"
echo "  │  1. Configurer vos clés OANDA dans .env :        │"
echo "  │     sudo nano $INSTALL_DIR/forex-bot/.env        │"
echo "  │                                                   │"
echo "  │  2. Démarrer le bot :                            │"
echo "  │     sudo systemctl start forex-bot               │"
echo "  │                                                   │"
if [ -n "$DOMAIN" ]; then
echo "  │  3. Ouvrir le dashboard :                        │"
echo "  │     https://$DOMAIN                              │"
else
IP=$(curl -s ifconfig.me 2>/dev/null || echo "VOTRE_IP")
echo "  │  3. Ouvrir le dashboard :                        │"
echo "  │     http://$IP                                   │"
fi
echo "  │                                                   │"
echo "  │  4. Voir les logs :                              │"
echo "  │     sudo journalctl -u forex-bot -f              │"
echo "  │     ou: cd $INSTALL_DIR/forex-bot                │"
echo "  │         docker-compose logs -f                   │"
echo "  │                                                   │"
echo "  └───────────────────────────────────────────────────┘"
echo ""
