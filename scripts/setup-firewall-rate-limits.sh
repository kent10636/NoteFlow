#!/usr/bin/env bash
# Configure Vercel Firewall rate limits for NoteFlow (production).
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

echo "==> Staging /api/register rate limit (5 req / 15 min per IP)..."
npx vercel firewall rules add "Rate limit register" \
  --condition '{"type":"path","op":"eq","value":"/api/register"}' \
  --condition '{"type":"method","op":"eq","value":"POST"}' \
  --action rate_limit \
  --rate-limit-window 900 \
  --rate-limit-requests 5 \
  --rate-limit-keys ip \
  --rate-limit-action rate_limit \
  --yes

echo ""
echo "==> Publishing firewall rules..."
npx vercel firewall publish --yes

echo ""
echo "✅ Firewall rate limit published for /api/register"
echo "ℹ️  /api/upload is protected in application code (10 req / 10 min per user)."