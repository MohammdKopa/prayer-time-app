#!/usr/bin/env bash
# Builds a tarball ready to scp to the VPS.
# Output: dist/prayer-time-app-<git-sha>.tar.gz
set -euo pipefail

cd "$(dirname "$0")/.."

echo "→ npm ci"
npm ci --no-audit --no-fund

echo "→ next build (standalone)"
npm run build

echo "→ assembling .next/standalone with static + public"
cp -r .next/static .next/standalone/.next/
cp -r public .next/standalone/

SHA=$(git rev-parse --short HEAD 2>/dev/null || date +%Y%m%d-%H%M%S)
mkdir -p dist
TARBALL="dist/prayer-time-app-${SHA}.tar.gz"

echo "→ creating $TARBALL"
tar -czf "$TARBALL" -C .next/standalone .

echo
echo "✓ Bundle ready: $TARBALL"
echo "  Size: $(du -h "$TARBALL" | cut -f1)"
echo
echo "Next: scp $TARBALL root@<vps>:/opt/prayer-time-app/  (then see DEPLOY.md)"
