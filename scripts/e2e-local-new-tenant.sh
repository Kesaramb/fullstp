#!/usr/bin/env bash
# e2e-local-new-tenant.sh — Full E2E: new tenant = fresh DB + migrate + bootstrap + build + HTTP smoke
#
# Does NOT require SSH. Requires: Docker, pnpm, network for pnpm install.
#
# Usage (from repo root):
#   bash scripts/e2e-local-new-tenant.sh
#
# What it does:
#   1. Starts a throwaway Postgres 16 container on a random host port
#   2. Copies src/golden-image to .tmp/e2e-tenant-<id> (no node_modules)
#   3. pnpm install, payload migrate, bootstrap-tenant admin
#   4. next build, next start on a free localhost port
#   5. GET /api/health/live, /api/health, POST /api/users/login
#   6. Stops container and removes temp dir
#
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
GOLDEN="${ROOT}/src/golden-image"
TMP="${ROOT}/.tmp/e2e-tenant-$(date +%s)-$$"
PG_PORT=$((15432 + RANDOM % 1000))
APP_PORT=$((3999 + RANDOM % 500))
CONTAINER="fullstp-e2e-pg-$$"
ADMIN_EMAIL="admin@e2e-local.test"
ADMIN_PASS="E2e-local-$(openssl rand -hex 6)"
SECRET="e2e-secret-$(openssl rand -hex 16)"

if ! docker info >/dev/null 2>&1; then
  echo "ERROR: Docker is not running or not accessible."
  exit 1
fi

cleanup() {
  docker rm -f "${CONTAINER}" >/dev/null 2>&1 || true
  if [[ -n "${SERVER_PID:-}" ]] && kill -0 "${SERVER_PID}" 2>/dev/null; then
    kill "${SERVER_PID}" 2>/dev/null || true
    wait "${SERVER_PID}" 2>/dev/null || true
  fi
  rm -rf "${TMP}"
}
trap cleanup EXIT

echo "=== Local new-tenant E2E ==="
echo "  Temp app:    ${TMP}"
echo "  Postgres:    127.0.0.1:${PG_PORT} (container ${CONTAINER})"
echo "  App URL:     http://127.0.0.1:${APP_PORT}"
echo ""

echo "[1/7] Starting Postgres..."
docker run -d \
  --name "${CONTAINER}" \
  -e POSTGRES_USER=e2e \
  -e POSTGRES_PASSWORD=e2e \
  -e POSTGRES_DB=e2e \
  -p "${PG_PORT}:5432" \
  postgres:16-alpine >/dev/null

for _ in $(seq 1 45); do
  if docker exec "${CONTAINER}" pg_isready -U e2e >/dev/null 2>&1; then
    echo "  Postgres ready."
    break
  fi
  sleep 1
done

if ! docker exec "${CONTAINER}" pg_isready -U e2e >/dev/null 2>&1; then
  echo "ERROR: Postgres did not become ready in time."
  exit 1
fi

echo "[2/7] Copying golden-image → temp tenant..."
mkdir -p "${ROOT}/.tmp"
rsync -a \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='data' \
  --exclude='.turbo' \
  "${GOLDEN}/" "${TMP}/"

# Export tenant env for all subprocesses (overrides host DATABASE_URI / PG* from developer shell)
export DATABASE_URI="postgresql://e2e:e2e@127.0.0.1:${PG_PORT}/e2e"
export PAYLOAD_SECRET="${SECRET}"
export NEXT_PUBLIC_SITE_URL="http://127.0.0.1:${APP_PORT}"
export PORT="${APP_PORT}"
export NODE_ENV=production
unset PGDATABASE PGUSER PGHOST PGPORT PGHOSTADDR 2>/dev/null || true

cat > "${TMP}/.env" <<ENV
DATABASE_URI=${DATABASE_URI}
PAYLOAD_SECRET=${PAYLOAD_SECRET}
NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}
PORT=${PORT}
NODE_ENV=${NODE_ENV}
ENV

echo "[3/7] pnpm install..."
(cd "${TMP}" && pnpm install --frozen-lockfile)

echo "[4/7] payload migrate..."
(cd "${TMP}" && pnpm exec payload migrate)

echo "[5/7] bootstrap-tenant..."
(cd "${TMP}" && pnpm exec tsx scripts/bootstrap-tenant.ts \
  --admin-email "${ADMIN_EMAIL}" \
  --admin-password "${ADMIN_PASS}" \
  --json) | tail -1

echo "[6/7] next build..."
(cd "${TMP}" && pnpm exec next build)

echo "[7/7] Start server + smoke tests..."
cd "${TMP}"
pnpm exec next start -p "${APP_PORT}" &
SERVER_PID=$!
cd "${ROOT}"

for _ in $(seq 1 60); do
  if curl -sf "http://127.0.0.1:${APP_PORT}/api/health/live" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

echo "  GET /api/health/live"
curl -sf "http://127.0.0.1:${APP_PORT}/api/health/live" | head -c 200
echo ""

echo "  GET /api/health"
curl -sf "http://127.0.0.1:${APP_PORT}/api/health" | head -c 400
echo ""

echo "  POST /api/users/login"
TOKEN_JSON=$(curl -sf -X POST "http://127.0.0.1:${APP_PORT}/api/users/login" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"${ADMIN_EMAIL}\",\"password\":\"${ADMIN_PASS}\"}")

if ! echo "${TOKEN_JSON}" | grep -q '"token"'; then
  echo "ERROR: Login did not return a token."
  echo "${TOKEN_JSON}"
  exit 1
fi

echo "  Login OK (JWT received)."

# Stop server before trap removes TMP
if kill -0 "${SERVER_PID}" 2>/dev/null; then
  kill "${SERVER_PID}" 2>/dev/null || true
  wait "${SERVER_PID}" 2>/dev/null || true
fi
SERVER_PID=""

echo ""
echo "=== LOCAL NEW-TENANT E2E: PASSED ==="
