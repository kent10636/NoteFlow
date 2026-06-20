#!/bin/bash
set -e
BASE="${1:-http://localhost:3000}"

echo "=== NoteFlow 本地功能验证 ==="
echo "Base URL: $BASE"

# Health checks
echo -n "Landing page: "
curl -s -o /dev/null -w "%{http_code}\n" "$BASE/"

echo -n "Login page: "
curl -s -o /dev/null -w "%{http_code}\n" "$BASE/login"

# Register test user
EMAIL="verify-$(date +%s)@noteflow.dev"
echo "Registering: $EMAIL"
REG=$(curl -s -X POST "$BASE/api/register" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Verify\",\"email\":\"$EMAIL\",\"password\":\"test123456\"}")
echo "Register response: $REG"

echo "=== 验证完成 ==="