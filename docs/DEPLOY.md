# 部署与运维

## 生产环境

| 组件 | 地址 |
|------|------|
| 站点 | https://noteflow-mu-three.vercel.app |
| GitHub | https://github.com/kent10636/NoteFlow |
| Vercel | https://vercel.com/kentshi/noteflow |
| 健康检查 | `/api/health` |

推送 `main` 分支即自动部署。重连 Git：`npm run vercel:git-connect`

---

## 环境变量

在 [Vercel 环境变量](https://vercel.com/kentshi/noteflow/settings/environment-variables) 配置，**勿提交到 Git**：

| 变量 | 必填 | 说明 |
|------|------|------|
| `DATABASE_URL` | ✅ | Prisma Postgres 连接串 |
| `AUTH_SECRET` | ✅ | `openssl rand -base64 32` |
| `NEXTAUTH_SECRET` | ✅ | 同上 |
| `NEXTAUTH_URL` | ✅ | `https://noteflow-mu-three.vercel.app` |
| `BLOB_READ_WRITE_TOKEN` | ✅ | Blob 存储（`vercel blob create-store` 自动注入） |
| `GOOGLE_CLIENT_ID` | ❌ | Google 登录 |
| `GOOGLE_CLIENT_SECRET` | ❌ | Google 登录 |
| `XAI_API_KEY` | ❌ | Grok AI / Vision OCR |

维护脚本：

```bash
npm run setup:xai -- <key>
npm run setup:google -- <client-id> <client-secret>
npm run verify:google
```

---

## Google OAuth

在 [Google Cloud Console](https://console.cloud.google.com/apis/credentials) 创建 **Web application** 客户端：

```
Origins:  https://noteflow-mu-three.vercel.app  http://localhost:3000
Redirect: https://noteflow-mu-three.vercel.app/api/auth/callback/google
          http://localhost:3000/api/auth/callback/google
```

Testing 模式需将 Gmail 加入 Test users。配置后运行 `npm run verify:google`。

---

## 数据库

生产库使用 Prisma Postgres + pgvector。

### Schema 同步

Vercel 构建命令已包含 `prisma db push`，每次部署自动同步 schema：

```
prisma generate && prisma db push --accept-data-loss && next build
```

应用启动时 `ensureSchema()` 会兜底补齐缺失列（如 `User.clipToken`），并在 `/api/health` 首次访问时触发。

手动同步（仅在紧急情况下使用）：

```bash
npm run db:push:production
```

> 注意：本地 `.env` / `.env.local` 中的 `DATABASE_URL` 会覆盖 Vercel CLI 注入的生产变量。`db:push:production` 脚本会临时移开本地 env 文件。

### 日常维护

```bash
npm run db:pgvector    # 启用 pgvector
npm run db:backfill    # 补全嵌入向量
npm run db:stats       # 库统计
```

---

## 浏览器剪藏

1. 登录后访问 `/dashboard/settings`，生成剪藏令牌
2. 安装 Chrome 扩展：加载项目 `extension/` 目录（开发者模式）
3. 在扩展中填入生产地址 `https://noteflow-mu-three.vercel.app` 与令牌
4. 扩展调用 `POST /api/clip`（Bearer 鉴权，无需浏览器 session）

---

## 验证

```bash
npm run deploy:check
curl https://noteflow-mu-three.vercel.app/api/health
npm run verify:google
npm test
```

---

## 常见问题

| 问题 | 处理 |
|------|------|
| Google 登录「请求无效」 | 运行 `npm run verify:google`，检查 redirect URI |
| Google 登录「Server error」 | 多为 DB schema 未同步；重新部署或访问 `/api/health` 触发 `ensureSchema` |
| 剪藏设置加载失败 | 重启 dev server 并执行 `npx prisma generate`；生产环境重新部署 |
| 登录后 NextAuth 报错 | 确认 `NEXTAUTH_URL`、`AUTH_SECRET` |
| 上传失败 | 检查 `BLOB_READ_WRITE_TOKEN` |
| AI 返回本地回退 | xAI 账户充值 |
| 构建失败 | 确认 Vercel 已配 `DATABASE_URL` |
| 本地 schema 变更未生效 | `npx prisma generate && npm run dev`（Prisma Client 缓存需重启） |