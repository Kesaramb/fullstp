#!/bin/bash
echo "=== FullStop Doctor ==="
PASS=0
FAIL=0

# Node version
NODE_V=$(node --version 2>/dev/null)
if [[ "$NODE_V" =~ ^v(18|20|22) ]]; then
  echo "  [OK] Node.js: $NODE_V"
  ((PASS++))
else
  echo "  [FAIL] Node.js: ${NODE_V:-not found} (need v18+)"
  ((FAIL++))
fi

# npm
NPM_V=$(npm --version 2>/dev/null)
if [ -n "$NPM_V" ]; then
  echo "  [OK] npm: $NPM_V"
  ((PASS++))
else
  echo "  [FAIL] npm: not found"
  ((FAIL++))
fi

# node_modules
if [ -d "node_modules" ]; then
  echo "  [OK] node_modules: installed"
  ((PASS++))
else
  echo "  [FAIL] node_modules: missing (run npm install)"
  ((FAIL++))
fi

# payload.config.ts
if [ -f "payload.config.ts" ]; then
  echo "  [OK] payload.config.ts: exists"
  ((PASS++))
else
  echo "  [FAIL] payload.config.ts: missing"
  ((FAIL++))
fi

# .env
if [ -f ".env" ]; then
  echo "  [OK] .env: exists"
  ((PASS++))
else
  echo "  [WARN] .env: missing (copy from .env.example)"
fi

# data directory
if [ -d "data" ]; then
  echo "  [OK] data/: exists"
  ((PASS++))
else
  echo "  [WARN] data/: missing (will be created on first run)"
fi

# Docker
DOCKER_V=$(docker --version 2>/dev/null)
if [ -n "$DOCKER_V" ]; then
  echo "  [OK] Docker: $DOCKER_V"
  ((PASS++))
else
  echo "  [WARN] Docker: not found (needed for deployment)"
fi

echo ""
echo "Results: $PASS passed, $FAIL failed"
if [ "$FAIL" -gt 0 ]; then
  echo "STATUS: UNHEALTHY"
  exit 1
else
  echo "STATUS: HEALTHY"
fi
