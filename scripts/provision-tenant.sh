#!/bin/bash
# provision-tenant.sh — Phase 1: Add a new tenant via PM2
#
# Usage:
#   bash scripts/provision-tenant.sh --id acme --domain acme.fullstp.com --port 3001 --secret <secret>
#
# What it does:
#   1. Clones the Golden Image to /var/fullstp/tenants/{TENANT_ID}/
#   2. Installs deps + builds Next.js standalone output
#   3. Creates the SQLite data directory
#   4. Registers a PM2 process entry in config/ecosystem.config.js
#   5. Adds a Caddy route via admin API (localhost:{PORT})
#   6. Starts the PM2 process
#
# Prerequisites:
#   - PM2 installed globally: npm install -g pm2
#   - Caddy running with admin API on port 2019
#   - Golden Image repo on disk (GOLDEN_IMAGE_PATH)

set -euo pipefail

# ── Config ──────────────────────────────────────────────────────────────────
GOLDEN_IMAGE_PATH="${GOLDEN_IMAGE_PATH:-$(pwd)}"
TENANTS_ROOT="${TENANTS_ROOT:-/var/fullstp/tenants}"
LOGS_ROOT="${LOGS_ROOT:-/var/log/fullstp}"
CADDY_ADMIN="${CADDY_ADMIN:-http://localhost:2019}"
ECOSYSTEM_CONFIG="${ECOSYSTEM_CONFIG:-$(pwd)/config/ecosystem.config.js}"

# ── Parse args ──────────────────────────────────────────────────────────────
TENANT_ID=""
TENANT_DOMAIN=""
PORT=""
PAYLOAD_SECRET=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --id)       TENANT_ID="$2";       shift 2 ;;
    --domain)   TENANT_DOMAIN="$2";   shift 2 ;;
    --port)     PORT="$2";            shift 2 ;;
    --secret)   PAYLOAD_SECRET="$2";  shift 2 ;;
    *) echo "Unknown arg: $1"; exit 1 ;;
  esac
done

if [[ -z "$TENANT_ID" || -z "$TENANT_DOMAIN" || -z "$PORT" || -z "$PAYLOAD_SECRET" ]]; then
  echo "ERROR: --id, --domain, --port, and --secret are all required."
  exit 1
fi

TENANT_DIR="$TENANTS_ROOT/$TENANT_ID"
DATA_DIR="$TENANT_DIR/data"
LOG_DIR="$LOGS_ROOT/$TENANT_ID"

echo "=== Provisioning tenant: $TENANT_ID ($TENANT_DOMAIN) on port $PORT ==="

# ── Step 1: Clone Golden Image ───────────────────────────────────────────────
echo "Step 1/5: Cloning Golden Image..."
if [[ -d "$TENANT_DIR" ]]; then
  echo "  ERROR: $TENANT_DIR already exists. Tenant ID may be duplicate."
  exit 1
fi

mkdir -p "$TENANT_DIR"
# Copy built standalone output from Golden Image
# In production, clone the git repo and build; here we rsync the standalone output
rsync -a --exclude='.git' --exclude='node_modules' --exclude='data' \
  "$GOLDEN_IMAGE_PATH/" "$TENANT_DIR/"

# ── Step 2: Build ────────────────────────────────────────────────────────────
echo "Step 2/5: Building standalone output..."
cd "$TENANT_DIR"
npm ci --omit=dev
PAYLOAD_SECRET="$PAYLOAD_SECRET" \
  DATABASE_URI="file:$DATA_DIR/database.db" \
  NEXT_PUBLIC_SITE_URL="https://$TENANT_DOMAIN" \
  npm run build
cd -

# ── Step 3: Data directory ───────────────────────────────────────────────────
echo "Step 3/5: Creating data + log directories..."
mkdir -p "$DATA_DIR" "$LOG_DIR"
chmod 750 "$DATA_DIR"

# ── Step 4: Register PM2 process ─────────────────────────────────────────────
echo "Step 4/5: Registering PM2 process..."
# Append a new tenant entry to ecosystem.config.js apps array
# Uses node to do a safe JSON-aware insertion
node - <<EOF
const fs = require('fs');
const path = require('path');
const configPath = '$ECOSYSTEM_CONFIG';
const src = fs.readFileSync(configPath, 'utf8');

const entry = \`    {
      name: 'tenant-$TENANT_ID',
      script: '.next/standalone/server.js',
      cwd: '$TENANT_DIR',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: $PORT,
        HOSTNAME: '0.0.0.0',
        PAYLOAD_SECRET: '$PAYLOAD_SECRET',
        DATABASE_URI: 'file:$DATA_DIR/database.db',
        NEXT_PUBLIC_SITE_URL: 'https://$TENANT_DOMAIN',
        R2_ENDPOINT: process.env.R2_ENDPOINT || '',
        R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID || '',
        R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY || '',
        R2_BUCKET: process.env.R2_BUCKET || '',
      },
      error_file: '$LOG_DIR/err.log',
      out_file: '$LOG_DIR/out.log',
      time: true,
    },\`;

// Insert before the closing ], of apps array
const updated = src.replace('  ],\n}', entry + '\n  ],\n}');
fs.writeFileSync(configPath, updated);
console.log('  PM2 entry written to ecosystem.config.js');
EOF

pm2 reload "$ECOSYSTEM_CONFIG" --update-env 2>/dev/null || pm2 start "$ECOSYSTEM_CONFIG"

# ── Step 5: Register Caddy route ─────────────────────────────────────────────
echo "Step 5/5: Adding Caddy route for $TENANT_DOMAIN -> localhost:$PORT..."
curl -s -X POST "$CADDY_ADMIN/config/apps/http/servers/srv0/routes" \
  -H "Content-Type: application/json" \
  -d "{
    \"match\": [{\"host\": [\"$TENANT_DOMAIN\"]}],
    \"handle\": [{
      \"handler\": \"reverse_proxy\",
      \"upstreams\": [{\"dial\": \"localhost:$PORT\"}]
    }]
  }"

echo ""
echo "=== Tenant '$TENANT_ID' provisioned ==="
echo "  URL:    https://$TENANT_DOMAIN"
echo "  Port:   $PORT"
echo "  Data:   $DATA_DIR"
echo "  Logs:   $LOG_DIR"
echo "  PM2:    pm2 logs tenant-$TENANT_ID"
