#!/bin/bash
set -e

echo "=== FullStop Verify Pipeline ==="
echo ""

echo "Step 1/5: Generating Payload types..."
npx payload generate:types 2>/dev/null || echo "  Skipped (payload not initialized)"
echo "  Done"

echo "Step 2/5: TypeScript type check..."
npx tsc --noEmit
echo "  Pass"

echo "Step 3/5: ESLint..."
npx next lint
echo "  Pass"

echo "Step 4/5: Building..."
npx next build
echo "  Pass"

echo "Step 5/5: Running tests..."
npx vitest run
echo "  Pass"

echo ""
echo "=== VERIFY: ALL CHECKS PASSED ==="
