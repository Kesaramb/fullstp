#!/bin/bash
# Deploy the golden image tenant template to the HestiaCP server.
#
# This script:
# 1. Creates a HestiaCP web domain for the golden image
# 2. Uploads the golden image files via SCP
# 3. Installs dependencies and builds
# 4. Verifies the deployment
#
# Usage: bash scripts/deploy-golden-image.sh
#
# Requires: SSH access to the server (password or key-based)

set -e

SERVER="${DEPLOY_SERVER_IP:-167.86.81.161}"
SSH_USER="${DEPLOY_SSH_USER:-root}"
DOMAIN="golden-image.${SERVER}.nip.io"
NODEAPP="/home/admin/web/${DOMAIN}/nodeapp"
GOLDEN_IMAGE_DIR="src/golden-image"

echo "=== FullStop Golden Image Deployer ==="
echo "Server: ${SERVER}"
echo "Domain: ${DOMAIN}"
echo "Source: ${GOLDEN_IMAGE_DIR}"
echo ""

# Check golden image exists locally
if [ ! -f "${GOLDEN_IMAGE_DIR}/payload.config.ts" ]; then
  echo "ERROR: Golden image not found at ${GOLDEN_IMAGE_DIR}/payload.config.ts"
  exit 1
fi

echo "[1/5] Creating HestiaCP web domain..."
ssh "${SSH_USER}@${SERVER}" "export PATH=\$PATH:/usr/local/hestia/bin && v-add-web-domain admin ${DOMAIN} ${SERVER} 2>&1 || echo 'Domain may already exist'"

echo "[2/5] Creating nodeapp directory..."
ssh "${SSH_USER}@${SERVER}" "mkdir -p ${NODEAPP}"

echo "[3/5] Uploading golden image files..."
# Upload all golden image files
scp -r "${GOLDEN_IMAGE_DIR}/payload.config.ts" "${SSH_USER}@${SERVER}:${NODEAPP}/"
scp -r "${GOLDEN_IMAGE_DIR}/package.json" "${SSH_USER}@${SERVER}:${NODEAPP}/"
scp -r "${GOLDEN_IMAGE_DIR}/next.config.mjs" "${SSH_USER}@${SERVER}:${NODEAPP}/"
scp -r "${GOLDEN_IMAGE_DIR}/tsconfig.json" "${SSH_USER}@${SERVER}:${NODEAPP}/"
scp -r "${GOLDEN_IMAGE_DIR}/postcss.config.mjs" "${SSH_USER}@${SERVER}:${NODEAPP}/"
scp -r "${GOLDEN_IMAGE_DIR}/src" "${SSH_USER}@${SERVER}:${NODEAPP}/"

echo "[4/5] Installing dependencies and building..."
ssh "${SSH_USER}@${SERVER}" "cd ${NODEAPP} && pnpm install 2>&1 | tail -5"
echo "Build step skipped — golden image is a template, not a running app."
echo "Each tenant clones these files, gets its own .env, then builds."

echo "[5/5] Verifying deployment..."
VERIFY=$(ssh "${SSH_USER}@${SERVER}" "test -f ${NODEAPP}/payload.config.ts && test -f ${NODEAPP}/src/blocks/Hero/config.ts && test -f ${NODEAPP}/src/collections/Pages.ts && echo 'VERIFIED' || echo 'FAILED'")

if [ "${VERIFY}" = "VERIFIED" ]; then
  echo ""
  echo "=== Golden Image Deployed Successfully ==="
  echo "Location: ${NODEAPP}"
  echo "Blocks: Hero, RichContent, CallToAction"
  echo "Collections: Pages, Media, Users"
  echo "Globals: Header, Footer, SiteSettings"
  echo "DB Adapter: PostgreSQL (postgresAdapter)"
  echo ""
  echo "New tenant deployments will now clone from this template."
else
  echo "ERROR: Verification failed. Check server logs."
  exit 1
fi
