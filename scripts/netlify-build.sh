#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

bash "$(dirname "$0")/bootstrap-crowdyjs.sh"

echo "Building simple-web-demo..."
npm ci --prefix "$ROOT"
npm run build --prefix "$ROOT"
