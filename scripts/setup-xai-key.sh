#!/usr/bin/env bash
# Sync XAI_API_KEY to Vercel (production, preview, development).
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

KEY="${1:-${XAI_API_KEY:-}}"
if [ -z "$KEY" ]; then
  echo "用法: npm run setup:xai -- <your-xai-api-key>"
  echo "或:   XAI_API_KEY=xxx npm run setup:xai"
  exit 1
fi

for ENV in production preview development; do
  printf '%s' "$KEY" | npx vercel env add XAI_API_KEY "$ENV" --sensitive --force --yes
  echo "✅ $ENV"
done

echo ""
echo "环境变量已更新。推送代码触发重新部署："
echo "  git commit --allow-empty -m 'chore: redeploy after XAI_API_KEY' && git push"