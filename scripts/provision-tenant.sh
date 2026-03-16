#!/bin/bash
# provision-tenant.sh — Phase 1: Provision a FullStop tenant on HestiaCP + PM2
#
# Usage:
#   bash scripts/provision-tenant.sh --domain rumba.fullstp.com --port 3001 --secret <secret>
#
# What it does:
#   1. Creates the web domain in HestiaCP (admin user)
#   2. Sets Node.js proxy template
#   3. Clones the Golden Image to /home/admin/web/{DOMAIN}/nodeapp/
#   4. Installs deps + builds Next.js
#   5. Creates the SQLite data directory, writes .env
#   6. Starts PM2 process
#   7. Configures Nginx proxy via custom includes (fallback if backend-port unavailable)
#   8. Issues Let's Encrypt TLS certificate
#
# Prerequisites:
#   - PM2 installed globally
#   - HestiaCP installed with admin user
#   - pnpm installed globally
#   - Golden Image repo on disk (GOLDEN_IMAGE_PATH)
#   - DNS A record for DOMAIN pointing to server IP
#
# Server: 167.86.81.161 (Contabo VPS, Ubuntu 24.04)

set -euo pipefail

# ── Config ──────────────────────────────────────────────────────────────────
GOLDEN_IMAGE_PATH="${GOLDEN_IMAGE_PATH:-$(pwd)}"
HESTIA_USER="${HESTIA_USER:-admin}"
HESTIA_BIN="/usr/local/hestia/bin"
SERVER_IP="${SERVER_IP:-167.86.81.161}"

export PATH="$PATH:$HESTIA_BIN"

# ── Parse args ──────────────────────────────────────────────────────────────
TENANT_DOMAIN=""
PORT=""
PAYLOAD_SECRET=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --domain)  TENANT_DOMAIN="$2"; shift 2 ;;
    --port)    PORT="$2";          shift 2 ;;
    --secret)  PAYLOAD_SECRET="$2"; shift 2 ;;
    *) echo "Unknown arg: $1"; exit 1 ;;
  esac
done

if [[ -z "$TENANT_DOMAIN" || -z "$PORT" || -z "$PAYLOAD_SECRET" ]]; then
  echo "ERROR: --domain, --port, and --secret are all required."
  exit 1
fi

TENANT_DIR="/home/$HESTIA_USER/web/$TENANT_DOMAIN/nodeapp"
DATA_DIR="$TENANT_DIR/data"
CONF_DIR="/home/$HESTIA_USER/conf/web/$TENANT_DOMAIN"

echo "=== Provisioning tenant: $TENANT_DOMAIN on port $PORT ==="

# ── Step 1: Create web domain in HestiaCP ──────────────────────────────────
echo "Step 1/8: Creating web domain in HestiaCP..."
v-add-web-domain "$HESTIA_USER" "$TENANT_DOMAIN" "$SERVER_IP"
echo "  Domain registered."

# ── Step 2: Set proxy template ─────────────────────────────────────────────
echo "Step 2/8: Setting Node.js proxy template..."
v-change-web-domain-proxy-tpl "$HESTIA_USER" "$TENANT_DOMAIN" nodeapp
echo "  Proxy template set to 'nodeapp'."

# ── Step 3: Clone Golden Image ─────────────────────────────────────────────
echo "Step 3/8: Cloning Golden Image..."
if [[ -d "$TENANT_DIR" && -f "$TENANT_DIR/package.json" ]]; then
  echo "  ERROR: $TENANT_DIR already contains an app. Aborting."
  exit 1
fi

mkdir -p "$TENANT_DIR"
rsync -a --exclude='.git' --exclude='node_modules' --exclude='data' --exclude='.next' \
  "$GOLDEN_IMAGE_PATH/" "$TENANT_DIR/"

# ── Step 4: Create data dir + write .env ───────────────────────────────────
echo "Step 4/8: Creating data directory and .env..."
mkdir -p "$DATA_DIR"
chmod 750 "$DATA_DIR"

cat > "$TENANT_DIR/.env" <<ENV
PAYLOAD_SECRET=$PAYLOAD_SECRET
DATABASE_URI=file:$DATA_DIR/database.db
NEXT_PUBLIC_SITE_URL=https://$TENANT_DOMAIN
NODE_ENV=production
PORT=$PORT
R2_ENDPOINT=${R2_ENDPOINT:-}
R2_ACCESS_KEY_ID=${R2_ACCESS_KEY_ID:-}
R2_SECRET_ACCESS_KEY=${R2_SECRET_ACCESS_KEY:-}
R2_BUCKET=${R2_BUCKET:-}
ENV

# ── Step 5: Build ──────────────────────────────────────────────────────────
echo "Step 5/8: Installing deps + building..."
cd "$TENANT_DIR"
pnpm install
pnpm build
cd -

# Fix ownership
chown -R "$HESTIA_USER:$HESTIA_USER" "/home/$HESTIA_USER/web/$TENANT_DOMAIN/"

# ── Step 6: Start PM2 process ─────────────────────────────────────────────
echo "Step 6/8: Starting PM2 process..."
pm2 start pnpm --name "$TENANT_DOMAIN" --cwd "$TENANT_DIR" -- start
pm2 save
echo "  PM2 process '$TENANT_DOMAIN' started on port $PORT."

# ── Step 7: Configure Nginx proxy ─────────────────────────────────────────
echo "Step 7/8: Configuring Nginx proxy to localhost:$PORT..."

# Try the built-in backend port command first
if v-change-web-domain-backend-port "$HESTIA_USER" "$TENANT_DOMAIN" "$PORT" 2>/dev/null; then
  echo "  Backend port set via HestiaCP CLI."
else
  # Fallback: custom nginx includes
  echo "  Using custom nginx includes for port routing."

  cat > "$CONF_DIR/nginx.conf_payload" <<CONF
location / {
    proxy_pass http://127.0.0.1:${PORT};
    proxy_http_version 1.1;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_cache_bypass \$http_upgrade;
    proxy_buffering off;
    client_max_body_size 100m;
}
CONF

  cp "$CONF_DIR/nginx.conf_payload" "$CONF_DIR/nginx.ssl.conf_payload"
  systemctl restart nginx
  echo "  Custom nginx includes written and nginx restarted."
fi

# ── Step 8: Issue TLS certificate ──────────────────────────────────────────
echo "Step 8/8: Issuing Let's Encrypt TLS certificate..."
v-add-letsencrypt-domain "$HESTIA_USER" "$TENANT_DOMAIN"
v-add-web-domain-ssl-force "$HESTIA_USER" "$TENANT_DOMAIN"
echo "  TLS certificate issued and HTTPS forced."

echo ""
echo "=== Tenant '$TENANT_DOMAIN' provisioned ==="
echo "  URL:     https://$TENANT_DOMAIN"
echo "  Admin:   https://$TENANT_DOMAIN/admin"
echo "  Port:    $PORT"
echo "  Data:    $DATA_DIR"
echo "  PM2:     pm2 logs $TENANT_DOMAIN"
echo "  Hestia:  $HESTIA_USER / $TENANT_DOMAIN"
