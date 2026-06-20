#!/usr/bin/env bash
# Verify Google OAuth redirect URI is registered in Google Cloud Console.
set -euo pipefail

BASE_URL="${1:-${NEXTAUTH_URL:-https://noteflow-mu-three.vercel.app}}"
BASE_URL="${BASE_URL%/}"
COOKIE_JAR="$(mktemp)"
trap 'rm -f "$COOKIE_JAR"' EXIT

echo "🔍 检查 Google OAuth 配置: $BASE_URL"
echo ""

# 1. Providers
PROVIDERS=$(curl -sf "$BASE_URL/api/auth/providers" || true)
if ! echo "$PROVIDERS" | grep -q '"google"'; then
  echo "❌ Google Provider 未启用（检查 GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET）"
  exit 1
fi
echo "✅ Google Provider 已启用"

CLIENT_ID=$(echo "$PROVIDERS" | python3 -c "import sys,json; print(json.load(sys.stdin)['google']['callbackUrl'].split('/api')[0])" 2>/dev/null || echo "$BASE_URL")
CALLBACK=$(echo "$PROVIDERS" | python3 -c "import sys,json; print(json.load(sys.stdin)['google']['callbackUrl'])" 2>/dev/null || echo "$BASE_URL/api/auth/callback/google")
echo "   回调地址: $CALLBACK"

# 2. CSRF + sign-in redirect
CSRF=$(curl -sf -c "$COOKIE_JAR" "$BASE_URL/api/auth/csrf" | python3 -c "import sys,json; print(json.load(sys.stdin)['csrfToken'])")
GOOGLE_URL=$(curl -sf -b "$COOKIE_JAR" -c "$COOKIE_JAR" -X POST \
  "$BASE_URL/api/auth/signin/google" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "csrfToken=$CSRF&callbackUrl=$BASE_URL/dashboard" \
  -w "%{redirect_url}" -o /dev/null)

if [[ "$GOOGLE_URL" != *"accounts.google.com"* ]]; then
  echo "❌ 未能跳转到 Google（NextAuth 配置错误）: $GOOGLE_URL"
  exit 1
fi
echo "✅ NextAuth 可正常跳转到 Google"

# 3. Google redirect_uri check
REDIRECT_URI=$(python3 -c "from urllib.parse import urlparse, parse_qs; print(parse_qs(urlparse('$GOOGLE_URL').query)['redirect_uri'][0])")
GOOGLE_RESPONSE=$(curl -sf -o /dev/null -w "%{redirect_url}" "$GOOGLE_URL" || true)

if [[ "$GOOGLE_RESPONSE" == *"redirect_uri_mismatch"* ]] || [[ "$GOOGLE_RESPONSE" == *"oauth/error"* ]]; then
  echo ""
  echo "❌ Google 返回 redirect_uri_mismatch"
  echo "   即「禁止访问：此应用的请求无效」"
  echo ""
  echo "请在 Google Cloud Console 配置 OAuth 客户端（类型：Web application）："
  echo "  https://console.cloud.google.com/apis/credentials"
  echo ""
  echo "Authorized JavaScript origins:"
  echo "  $BASE_URL"
  echo "  http://localhost:3000"
  echo ""
  echo "Authorized redirect URIs:"
  echo "  $REDIRECT_URI"
  echo "  http://localhost:3000/api/auth/callback/google"
  echo ""
  echo "OAuth 同意屏幕（Testing 模式需添加测试用户）："
  echo "  https://console.cloud.google.com/apis/credentials/consent"
  exit 1
fi

echo "✅ Google 接受了 redirect_uri"
echo ""
echo "Google OAuth 配置正常。"