#!/bin/bash
# E2E Preflight — validates server readiness before real-server tests.
set -euo pipefail

SERVER="${DEPLOY_SERVER_IP:-167.86.81.161}"
SSH_USER="${DEPLOY_SSH_USER:-root}"
SSH_OPTS="-o ConnectTimeout=10 -o StrictHostKeyChecking=no -o BatchMode=yes"

if [ -n "${DEPLOY_SSH_KEY:-}" ]; then
  SSH_CMD="ssh ${SSH_OPTS} -i ${DEPLOY_SSH_KEY} ${SSH_USER}@${SERVER}"
elif [ -n "${DEPLOY_SSH_PASS:-}" ]; then
  SSH_CMD="sshpass -p '${DEPLOY_SSH_PASS}' ssh ${SSH_OPTS} ${SSH_USER}@${SERVER}"
else
  echo "FAIL: No SSH credentials (set DEPLOY_SSH_KEY or DEPLOY_SSH_PASS)"
  exit 1
fi

PASS=0
FAIL=0

check() {
  local label="$1"; shift
  if eval "$@" >/dev/null 2>&1; then
    echo "  [OK] ${label}"
    PASS=$((PASS + 1))
  else
    echo "  [FAIL] ${label}"
    FAIL=$((FAIL + 1))
  fi
}

echo "=== E2E Preflight Check ==="
echo "Server: ${SERVER}  User: ${SSH_USER}"
echo ""

echo "[1/7] SSH connectivity"
check "Connect to ${SERVER}" "${SSH_CMD} 'echo OK'"

echo "[2/7] Required binaries"
check "pm2"  "${SSH_CMD} 'which pm2'"
check "pnpm" "${SSH_CMD} 'which pnpm'"
check "node" "${SSH_CMD} 'which node'"

echo "[3/7] HestiaCP CLI"
check "v-list-web-domains" "${SSH_CMD} 'export PATH=\$PATH:/usr/local/hestia/bin && v-list-web-domains admin'"

echo "[4/7] Golden image template"
check "golden-image exists" "${SSH_CMD} 'test -f /home/admin/web/golden-image.${SERVER}.nip.io/nodeapp/payload.config.ts'"

echo "[5/7] PostgreSQL"
check "psql accessible" "${SSH_CMD} 'sudo -u postgres psql -c \"SELECT 1\"'"

echo "[6/7] Node version"
NODE_VER=$(${SSH_CMD} 'node --version' 2>/dev/null || echo 'unknown')
echo "  Node: ${NODE_VER}"

echo "[7/7] Port usage"
USED=$(${SSH_CMD} "ss -tlnp 2>/dev/null | grep -oP ':\K3[0-9]{3}' | sort -un | wc -l" 2>/dev/null || echo '?')
echo "  Ports in 3xxx range in use: ${USED}"

echo ""
echo "=== Results: ${PASS} passed, ${FAIL} failed ==="
[ "${FAIL}" -eq 0 ] && echo "PREFLIGHT: ALL CHECKS PASSED" || { echo "PREFLIGHT: FAILED"; exit 1; }
