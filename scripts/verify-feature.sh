#!/bin/bash
set -e

BRANCH=$(git branch --show-current)
echo "=== Feature Verification: $BRANCH ==="

# Check branch naming
if [[ ! "$BRANCH" =~ ^feature/ ]] && [[ ! "$BRANCH" =~ ^fix/ ]] && [[ "$BRANCH" != "main" ]]; then
  echo "WARNING: Branch '$BRANCH' doesn't follow naming convention (feature/* or fix/*)"
fi

# Check diff size
CHANGED=$(git diff --name-only main...HEAD 2>/dev/null | wc -l | tr -d ' ')
echo "Files changed vs main: $CHANGED"
if [ "$CHANGED" -gt 20 ]; then
  echo "WARNING: Large diff ($CHANGED files). Consider splitting into smaller features."
fi

# Run full verify
bash scripts/verify.sh
