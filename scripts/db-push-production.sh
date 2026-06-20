#!/usr/bin/env bash
# Push Prisma schema to the linked Vercel production database.
# Note: local .env / .env.local DATABASE_URL overrides production — temporarily moved aside.
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

BACKUP=()
for f in .env .env.local; do
  if [ -f "$f" ]; then
    mv "$f" "$f.push-bak"
    BACKUP+=("$f")
  fi
done

cleanup() {
  for f in "${BACKUP[@]}"; do
    if [ -f "$f.push-bak" ]; then
      mv "$f.push-bak" "$f"
    fi
  done
}
trap cleanup EXIT

echo "🔄 Pushing schema to Vercel production database..."
npx vercel env run --environment production -- npx prisma db push --accept-data-loss
echo "✅ Production schema synced"