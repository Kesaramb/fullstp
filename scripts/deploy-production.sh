#!/bin/bash
set -e

echo "=== Deploy Production ==="
echo ""
echo "WARNING: This will deploy to a live tenant environment."
echo "This action requires human approval per AGENTS.md."
echo ""
read -p "Confirm deployment (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
  echo "Deployment cancelled."
  exit 1
fi

TAG=${1:-prod-$(date +%s)}
echo "Building production image: fullstp-tenant:$TAG"
bash scripts/verify.sh
docker build -t fullstp-tenant:$TAG .
echo ""
echo "Production image built: fullstp-tenant:$TAG"
echo "Push to registry and update Caddy routing manually."
