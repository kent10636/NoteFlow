# 部署与运维

> 返回 [README](../README.md)

## 文档与隐私安全

以下内容**不要**写入 Markdown、Issue、截图或公开仓库：

- 数据库连接串（`DATABASE_URL`）及其中用户名、密码、主机
- `AUTH_SECRET` / `NEXTAUTH_SECRET`、`GOOGLE_CLIENT_SECRET`、`XAI_API_KEY`、`BLOB_READ_WRITE_TOKEN`
- 剪藏令牌、会话 Cookie、用户邮箱等运行时数据
- 可识别个人的生产域名（文档统一使用 `https://your-app.vercel.app` 占位符）

文档与脚本中的 URL、密钥均为占位符；真实值仅配置在 Vercel Dashboard 或本地未提交的 `.env` 文件中。

---

## 部署流程

推送 `main` 分支触发 Vercel 自动构建：

```
prisma generate && prisma db push --accept-data-loss && next build
```

构建完成后访问 `/api/health` 确认 `status: healthy`。

手动重连 Git：`npm run vercel:git-connect`

---

## 环境变量

在 **Vercel Dashboard → Project → Settings → Environment Variables** 配置，**切勿提交到 Git**。

模板见 [`.env.production.example`](../.env.production.example)。

| 变量 | 必填 | 说明 |
|------|------|------|
| `DATABASE_URL` | ✅ | PostgreSQL 连接串（生产建议 Prisma Postgres + pgvector） |
| `AUTH_SECRET` | ✅ | `openssl rand -base64 32` |
| `NEXTAUTH_SECRET` | ✅ | 同上 |
| `NEXTAUTH_URL` | ✅ | 生产站点 URL，如 `https://your-app.vercel.app`（无末尾斜杠） |
| `BLOB_READ_WRITE_TOKEN` | 推荐 | 文件上传（`vercel blob create-store` 可自动注入） |
| `GOOGLE_CLIENT_ID` | 可选 | Google 登录 |
| `GOOGLE_CLIENT_SECRET` | 可选 | Google 登录 |
| `XAI_API_KEY` | 可选 | Grok AI / Vision OCR；未配置或额度不足时使用本地回退 |

维护脚本（**勿在命令行历史中保留真实密钥**；优先用环境变量传参）：

```bash
# 推荐：通过环境变量传入，避免出现在 shell 历史
GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=... npm run setup:google

npm run setup:xai -- <your-xai-key>
npm run setup:google -- <client-id> <client-secret>
npm run verify:google -- https://your-app.vercel.app
npm run check:env
```

---

## Google OAuth

在 [Google Cloud Console](https://console.cloud.google.com/apis/credentials) 创建 **Web application** 客户端，配置：

```
Authorized JavaScript origins:
  https://your-app.vercel.app
  http://localhost:3000

Authorized redirect URIs:
  https://your-app.vercel.app/api/auth/callback/google
  http://localhost:3000/api/auth/callback/google
```

应用处于 Testing 模式时，需将使用的登录邮箱加入 **Test users**（测试邮箱亦勿写入公开文档）。配置完成后：

```bash
npm run verify:google -- https://your-app.vercel.app
```

---

## 数据库

### Schema 同步

- **自动**：每次 Vercel 构建执行 `prisma db push`
- **运行时兜底**：`ensureSchema()` 在健康检查与登录时补齐缺失列（如 `User.clipToken`）

紧急手动同步：

```bash
npm run db:push:production
```

> 本地 `.env` / `.env.local` 会覆盖 `vercel env run` 注入的生产 `DATABASE_URL`。`db:push:production` 会临时移开本地 env 文件。

### 日常维护

```bash
npm run db:pgvector    # 启用 pgvector（生产）
npm run db:backfill    # 补全嵌入向量（生产）
npm run db:stats       # 库统计（生产）
```

---

## 浏览器剪藏

1. 登录后在 `/dashboard/settings` 生成剪藏令牌
2. Chrome 开发者模式加载 `extension/` 目录
3. 填入站点 URL 与令牌（令牌仅保存在扩展本地存储，勿提交到 Git）；扩展通过 `POST /api/clip`（Bearer 鉴权）提交

---

## 部署后验证

```bash
npm run deploy:check
curl https://your-app.vercel.app/api/health
npm run verify:google -- https://your-app.vercel.app
npm test
```

---

## 常见问题

| 现象 | 处理 |
|------|------|
| Google 登录「请求无效」 | 检查 OAuth redirect URI 是否与 `NEXTAUTH_URL` 一致；运行 `verify:google` |
| Google 登录「Server error」 | 多为 DB schema 未同步；重新部署或访问 `/api/health` |
| 剪藏设置 500 | 执行 `npx prisma generate` 并重启；生产环境重新部署 |
| NextAuth 会话异常 | 确认 `NEXTAUTH_URL`、`AUTH_SECRET` 已配置且一致 |
| 上传失败 503 | 配置 `BLOB_READ_WRITE_TOKEN` |
| AI 返回本地回退文案 | xAI 额度不足，见 [known-issues.md](../known-issues.md) |
| 构建失败 | 确认 Vercel 已配置 `DATABASE_URL` |
| 本地 `Unknown field` | `npx prisma generate` 后重启 dev server |

更多限制说明：[known-issues.md](../known-issues.md)