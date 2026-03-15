#!/bin/bash
set -e

echo "=== Closing Session ==="

BRANCH=$(git branch --show-current)
echo "Branch: $BRANCH"

# Run verify
echo ""
echo "Running verify pipeline..."
bash scripts/verify.sh

# Summary
echo ""
echo "=== Session Summary ==="
echo "Branch: $BRANCH"
echo "Files changed: $(git diff --name-only main...HEAD 2>/dev/null | wc -l | tr -d ' ')"
echo "Status: CLEAN (all checks passed)"
echo ""
echo "Next: Update docs/context/progress.md, then commit."
