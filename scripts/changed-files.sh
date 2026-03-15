#!/bin/bash
echo "=== Changed Files (vs main) ==="
git diff --name-only main...HEAD 2>/dev/null || git diff --name-only HEAD
