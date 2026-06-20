#!/usr/bin/env bash
# Connect NoteFlow GitHub repo to Vercel project for automatic deployments.
set -euo pipefail

REPO_URL="${1:-https://github.com/kent10636/NoteFlow}"
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

cd "$PROJECT_DIR"

echo "==> Connecting $REPO_URL to Vercel project noteflow..."
if npx vercel git connect "$REPO_URL" 2>&1 | tee /tmp/vercel-git-connect.log; then
  CONNECT_OK=1
elif grep -q "already connected" /tmp/vercel-git-connect.log; then
  echo "ℹ️  Repository was already connected."
  CONNECT_OK=1
else
  CONNECT_OK=0
fi

if [ "${CONNECT_OK:-0}" -eq 1 ]; then
  echo ""
  echo "✅ Git repository connected."
else
  echo ""
  echo "❌ Connection failed."
  echo ""
  echo "If you see 'Login Connection to your GitHub account', complete these steps:"
  echo "  1. Open https://vercel.com/account/authentication"
  echo "  2. Click Connect next to GitHub and authorize Vercel"
  echo "  3. Re-run: npm run vercel:git-connect"
  exit 1
fi

echo ""
echo "==> Verifying project link..."
npx vercel project inspect noteflow

echo ""
echo "==> Next: push a commit to main to trigger the first Git deployment."
echo "    git commit --allow-empty -m 'chore: trigger Vercel Git deploy' && git push"