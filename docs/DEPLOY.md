# NoteFlow 部署指南

## 当前生产环境

| 组件 | 状态 | 地址 |
|------|------|------|
| Vercel 前端 | ✅ 已上线 | https://noteflow-mu-three.vercel.app |
| Prisma Postgres | ✅ 已 Claim | 托管于 Prisma Data Platform |
| Vercel Blob | ✅ 已接入 | `noteflow-uploads`（sin1） |
| Vercel Git | ✅ 已连接 | push `main` 自动部署 |
| GitHub | ✅ 已同步 | https://github.com/kent10636/NoteFlow |

> 环境变量和数据库连接字符串**仅存储在 Vercel Dashboard**，不写入代码仓库。

---

## 架构

```
用户 → Vercel (Next.js) → Prisma Postgres
              ↓                    ↓
        Vercel Blob          pgvector 语义搜索
              ↓
        xAI Grok API（Key 已配置，额度待充值）
```

---

## 推送代码到 GitHub

```bash
git push origin main
```

推荐使用 SSH（已配置）：

```bash
git remote set-url origin git@github.com:kent10636/NoteFlow.git
git push origin main
```

---

## 数据库选项

### 方案 A — Prisma Postgres（当前生产环境）

```bash
npx create-db create
# 按提示 Claim 数据库以永久保留
npx prisma db push
```

将连接字符串配置到 Vercel 环境变量 `DATABASE_URL`（**不要提交到 Git**）。

### 方案 B — Railway

```bash
npm i -g @railway/cli
railway login && railway init
railway add --database postgres
railway variables
```

启用 pgvector：

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

---

## Vercel 部署

### Git 自动部署（推荐，已启用）

```bash
git push origin main          # 生产环境
git push origin feature/xxx   # Preview 环境
```

仓库已连接：`kent10636/NoteFlow` → 项目 `noteflow`，生产分支 `main`。

重连命令：`npm run vercel:git-connect`

### CLI 手动部署（备用）

```bash
npx vercel login
npx vercel link --project noteflow
npx vercel deploy --prod --yes
```

### Vercel Blob（文件上传）

```bash
npx vercel blob create-store noteflow-uploads --access public --region sin1 --yes \
  --environment production --environment preview --environment development
```

创建后会自动注入 `BLOB_READ_WRITE_TOKEN`。本地开发可 `vercel env pull` 拉取。

### 环境变量

在 [Vercel 环境变量设置](https://vercel.com/kentshi/noteflow/settings/environment-variables) 配置：

| 变量 | 必填 | 说明 |
|------|------|------|
| `DATABASE_URL` | ✅ | 数据库连接字符串 |
| `AUTH_SECRET` | ✅ | `openssl rand -base64 32` |
| `NEXTAUTH_SECRET` | ✅ | 同上 |
| `NEXTAUTH_URL` | ✅ | `https://noteflow-mu-three.vercel.app` |
| `BLOB_READ_WRITE_TOKEN` | ✅* | Vercel Blob 自动注入（文件上传） |
| `XAI_API_KEY` | ❌ | Grok AI；已配置，需 xAI 账户额度 |

\* 通过 `vercel blob create-store` 创建存储时自动配置。

同步 XAI Key：

```bash
npm run setup:xai -- <your-xai-api-key>
git commit --allow-empty -m "chore: redeploy" && git push   # 触发重新部署
```

模板文件：[.env.production.example](../.env.production.example)（仅含占位符）

---

## 部署验证

```bash
npm run deploy:check
curl https://noteflow-mu-three.vercel.app/api/health
```

预期响应：

```json
{
  "status": "healthy",
  "checks": { "env": true, "database": true }
}
```

---

## 常见问题

### 登录后报错
- 确认 `NEXTAUTH_URL` 与 Vercel 域名一致
- 确认 `AUTH_SECRET` 已配置

### 构建失败
- 确保 Vercel 已配置 `DATABASE_URL`
- `postinstall` 会自动运行 `prisma generate`

### 语义搜索精度低
- pgvector 已在生产库启用（`npm run db:pgvector`）
- 配置并充值 `XAI_API_KEY` 提升 embedding 质量

### 文件上传失败（Vercel）
- 确认 `BLOB_READ_WRITE_TOKEN` 已配置（Vercel → Storage → Blob）
- 本地开发无需 Blob，使用 `public/uploads/`

### AI / OCR 返回本地回退内容
- 确认 `XAI_API_KEY` 已在 Vercel 配置
- 在 https://console.x.ai/ 检查账户额度是否充足

### 安全提醒
- **永远不要**将 `.env`、连接字符串、API 密钥提交到 Git
- 使用 `.vercelignore` 防止本地环境文件上传