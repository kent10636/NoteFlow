#!/bin/bash
# NoteFlow 部署前检查清单
set -e

echo "╔══════════════════════════════════════╗"
echo "║     NoteFlow 部署前检查清单           ║"
echo "╚══════════════════════════════════════╝"
echo

PASS=0
FAIL=0

check() {
  if eval "$2" > /dev/null 2>&1; then
    echo "✅ $1"
    PASS=$((PASS + 1))
  else
    echo "❌ $1"
    FAIL=$((FAIL + 1))
  fi
}

check "Node.js 已安装" "node --version"
check "npm 依赖已安装" "test -d node_modules"
check "Prisma Schema 存在" "test -f prisma/schema.prisma"
check "vercel.json 存在" "test -f vercel.json"
check "railway.toml 存在" "test -f railway.toml"
check ".env.production.example 存在" "test -f .env.production.example"
check "Git 仓库已初始化" "git rev-parse --git-dir"
check "GitHub remote 已配置" "git remote get-url origin"

echo
echo "运行测试..."
if npm test --silent 2>/dev/null; then
  echo "✅ 测试全部通过"
  PASS=$((PASS + 1))
else
  echo "❌ 测试失败"
  FAIL=$((FAIL + 1))
fi

echo
echo "运行构建..."
if npm run build --silent 2>/dev/null; then
  echo "✅ 生产构建通过"
  PASS=$((PASS + 1))
else
  echo "❌ 构建失败"
  FAIL=$((FAIL + 1))
fi

echo
echo "────────────────────────────────────"
echo "通过: $PASS  失败: $FAIL"
echo

if [ "$FAIL" -eq 0 ]; then
  echo "🚀 可以开始部署！参见 docs/DEPLOY.md"
else
  echo "⚠️  请先修复上述问题"
  exit 1
fi