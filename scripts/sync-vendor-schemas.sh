#!/usr/bin/env bash
# Refresh vendor/schemas/ from monorepo siblings (CKS maintainers only).
# Fork deploys rely on the committed vendor/*.gql files — no monorepo on Netlify.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MONOREPO_ROOT="$(dirname "$ROOT")"
DEST="${ROOT}/vendor/schemas"

if [[ ! -f "${MONOREPO_ROOT}/cks-management-api/schema.gql" ]]; then
  echo "Monorepo not found beside simple-web-demo." >&2
  echo "Fork owners: vendor/schemas/*.gql are already committed for Netlify builds." >&2
  echo "Update them manually when the public API schema changes, or sync from a monorepo checkout." >&2
  exit 1
fi

for pair in \
  "cks-management-api/schema.gql:management.gql" \
  "cks-game-api/schema.gql:game.gql"
do
  src_name="${pair%%:*}"
  dest_name="${pair##*:}"
  src="${MONOREPO_ROOT}/${src_name}"
  if [[ ! -f "$src" ]]; then
    echo "Missing ${src}" >&2
    exit 1
  fi
  mkdir -p "$DEST"
  cp "$src" "${DEST}/${dest_name}"
  echo "Synced ${dest_name}"
done
