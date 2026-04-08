#!/usr/bin/env bash

set -euo pipefail

echo "=== FullStop Tenant Release Validation ==="

required_paths=(
  "src/golden-image/package.json"
  "src/golden-image/payload.config.ts"
  "src/golden-image/next.config.mjs"
  "src/golden-image/tsconfig.json"
  "src/golden-image/src"
  "src/golden-image/scripts/bootstrap-tenant.ts"
  "src/golden-image/src/app/api/health/route.ts"
  "src/golden-image/src/app/api/health/live/route.ts"
  "scripts/server-runner/runner.js"
)

for required_path in "${required_paths[@]}"; do
  if [[ ! -e "${required_path}" ]]; then
    echo "Missing required release path: ${required_path}" >&2
    exit 1
  fi
done

echo "Running focused tenant release tests..."
npx vitest run \
  tests/unit/bridge/bridge.test.ts \
  tests/unit/bridge/types.test.ts \
  tests/unit/golden-image/build-safety.test.ts \
  tests/unit/golden-image/bootstrap-contract.test.ts

echo "Tenant release validation passed."
