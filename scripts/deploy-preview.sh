#!/bin/bash
# deploy-preview.sh — Start a local preview of the Golden Image via PM2
#
# Phase 1: Uses PM2 (not Docker) to start a preview process on port 3001.
# This matches the production Phase 1 runtime (PM2 fork mode, 512MB limit).
#
# Usage:
#   npm run deploy:preview
#   bash scripts/deploy-preview.sh [port]
#
# Requires: pm2 installed globally (npm install -g pm2)
set -e

PORT="${1:-3001}"
PROCESS_NAME="fullstp-preview"

echo "=== Deploy Preview (PM2) ==="

echo "Step 1/3: Running verify..."
bash scripts/verify.sh

echo "Step 2/3: Building standalone output..."
npm run build

echo "Step 3/3: Starting PM2 preview process on port $PORT..."

# Stop existing preview if running
pm2 delete "$PROCESS_NAME" 2>/dev/null || true

pm2 start .next/standalone/server.js \
  --name "$PROCESS_NAME" \
  --max-memory-restart 512M \
  -- \
  --env PORT="$PORT" \
  --env HOSTNAME="0.0.0.0" \
  --env NODE_ENV="production" \
  --env PAYLOAD_SECRET="preview-secret-for-local-testing-only" \
  --env DATABASE_URI="file:./data/preview.db"

# PM2 env vars must be set via env_production or inline
pm2 set "$PROCESS_NAME:PORT" "$PORT"

echo ""
echo "Preview running at: http://localhost:$PORT"
echo "Admin panel:        http://localhost:$PORT/admin"
echo "PM2 process:        $PROCESS_NAME"
echo ""
echo "To view logs: pm2 logs $PROCESS_NAME"
echo "To stop:      pm2 delete $PROCESS_NAME"
