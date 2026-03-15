#!/bin/bash
set -e
echo "=== FullStop Status ==="
echo ""
echo "Branch: $(git branch --show-current)"
echo "Last commit: $(git log -1 --format='%s' 2>/dev/null || echo 'No commits yet')"
echo ""
echo "Working tree:"
git status --short || echo "  Clean"
echo ""
echo "Changed files: $(git diff --name-only 2>/dev/null | wc -l | tr -d ' ')"
