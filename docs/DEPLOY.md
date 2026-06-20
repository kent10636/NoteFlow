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

生产库使用 Prisma Postgres + pgvector：

```bash
npm run db:pgvector    # 启用 pgvector
npm run db:backfill    # 补全嵌入向量
npm run db:stats       # 库统计
```

---

## 验证

```bash
npm run deploy:check
curl https://noteflow-mu-three.vercel.app/api/health
npm test
```

---

## 常见问题

| 问题 | 处理 |
|------|------|
| Google 登录「请求无效」 | 运行 `npm run verify:google`，检查 redirect URI |
| 登录后 NextAuth 报错 | 确认 `NEXTAUTH_URL`、`AUTH_SECRET` |
| 上传失败 | 检查 `BLOB_READ_WRITE_TOKEN` |
| AI 返回本地回退 | xAI 账户充值 |
| 构建失败 | 确认 Vercel 已配 `DATABASE_URL` |