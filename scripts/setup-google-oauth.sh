#!/usr/bin/env bash
# Sync Google OAuth credentials to Vercel (production, preview, development).
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

CLIENT_ID="${1:-${GOOGLE_CLIENT_ID:-}}"
CLIENT_SECRET="${2:-${GOOGLE_CLIENT_SECRET:-}}"

if [ -z "$CLIENT_ID" ] || [ -z "$CLIENT_SECRET" ]; then
  echo "用法: npm run setup:google -- <client-id> <client-secret>"
  echo "或:   GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=... npm run setup:google"
  exit 1
fi

for ENV in production preview development; do
  if [ "$ENV" = "development" ]; then
    printf '%s' "$CLIENT_ID" | npx vercel env add GOOGLE_CLIENT_ID "$ENV" --force --yes
    printf '%s' "$CLIENT_SECRET" | npx vercel env add GOOGLE_CLIENT_SECRET "$ENV" --force --yes
  else
    printf '%s' "$CLIENT_ID" | npx vercel env add GOOGLE_CLIENT_ID "$ENV" --sensitive --force --yes
    printf '%s' "$CLIENT_SECRET" | npx vercel env add GOOGLE_CLIENT_SECRET "$ENV" --sensitive --force --yes
  fi
  echo "✅ $ENV"
done

echo ""
echo "Google OAuth 环境变量已更新。推送代码触发重新部署："
echo "  git commit --allow-empty -m 'chore: redeploy after Google OAuth' && git push"