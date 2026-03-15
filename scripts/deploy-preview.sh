#!/bin/bash
set -e

TAG=${1:-preview-$(date +%s)}
echo "=== Deploy Preview: $TAG ==="

echo "Step 1: Running verify..."
bash scripts/verify.sh

echo "Step 2: Building Docker image..."
docker build -t fullstp-tenant:$TAG .

echo "Step 3: Starting preview container..."
docker run -d \
  --name fullstp-preview-$TAG \
  --memory=256m \
  --cpus=0.5 \
  -p 3001:3000 \
  -e PAYLOAD_SECRET=preview-secret-key-for-testing-only \
  -e DATABASE_URI=file:./data/database.db \
  fullstp-tenant:$TAG

echo ""
echo "Preview running at: http://localhost:3001"
echo "Admin panel: http://localhost:3001/admin"
echo "Container: fullstp-preview-$TAG"
echo ""
echo "To stop: docker stop fullstp-preview-$TAG && docker rm fullstp-preview-$TAG"
