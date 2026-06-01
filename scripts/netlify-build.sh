#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CROWDY_ROOT="$(dirname "$ROOT")/CrowdyJS"

if [[ ! -f "$CROWDY_ROOT/package.json" ]]; then
  echo "Cloning CrowdyJS (file: dependency)..."
  git clone --depth 1 https://github.com/CrowdedKingdoms/CrowdyJS.git "$CROWDY_ROOT"
fi

echo "Building CrowdyJS..."
npm ci --prefix "$CROWDY_ROOT"
npm run build --prefix "$CROWDY_ROOT"

echo "Building simple-web-demo..."
npm ci --prefix "$ROOT"
npm run build --prefix "$ROOT"
