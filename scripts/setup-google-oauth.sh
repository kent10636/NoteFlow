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

PROD_URL="${NEXTAUTH_URL:-https://noteflow-kent.vercel.app}"
PROD_URL="${PROD_URL%/}"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "请在 Google Cloud Console 配置 OAuth 客户端（Web application）："
echo "  https://console.cloud.google.com/apis/credentials"
echo ""
echo "Authorized JavaScript origins:"
echo "  $PROD_URL"
echo "  http://localhost:3000"
echo ""
echo "Authorized redirect URIs:"
echo "  $PROD_URL/api/auth/callback/google"
echo "  http://localhost:3000/api/auth/callback/google"
echo ""
echo "OAuth 同意屏幕（Testing 模式需将你的 Gmail 加入 Test users）："
echo "  https://console.cloud.google.com/apis/credentials/consent"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "环境变量已更新。推送代码触发重新部署："
echo "  git commit --allow-empty -m 'chore: redeploy after Google OAuth' && git push"
echo ""
echo "部署后验证："
echo "  npm run verify:google"