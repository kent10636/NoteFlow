# NoteFlow 一键部署指南

## 架构概览

```
用户 → Vercel (Next.js) → Railway (PostgreSQL + pgvector)
                ↓
           xAI Grok API (可选)
```

---

## 第一步：推送代码到 GitHub

仓库已创建：**https://github.com/kent10636/NoteFlow**

### 方式 A — HTTPS + Personal Access Token（推荐）

```bash
cd /Users/kent/Projects/NoteFlow

# 1. 确认 remote
git remote -v
# 应显示 origin → https://github.com/kent10636/NoteFlow.git

# 2. 推送（会提示输入凭据）
git push -u origin main
```

**凭据填写方式：**

| 提示项 | 填写内容 |
|--------|----------|
| Username | `kent10636`（你的 GitHub 用户名） |
| Password | **Personal Access Token**（不是 GitHub 密码） |

**创建 Token 步骤：**

1. 打开 https://github.com/settings/tokens
2. 点击 **Generate new token (classic)**
3. 勾选权限：`repo`（完整仓库访问）
4. 生成后复制 Token（只显示一次）
5. 在终端 Password 提示处粘贴 Token

### 方式 B — SSH（免重复输入密码）

```bash
# 1. 生成 SSH 密钥（如果没有）
ssh-keygen -t ed25519 -C "your@email.com"

# 2. 复制公钥
cat ~/.ssh/id_ed25519.pub
# 粘贴到 GitHub → Settings → SSH and GPG keys → New SSH key

# 3. 切换 remote 并推送
git remote set-url origin git@github.com:kent10636/NoteFlow.git
git push -u origin main
```

### 方式 C — GitHub CLI

```bash
brew install gh
gh auth login
git push -u origin main
```

### 推送成功验证

```bash
git log --oneline -1
# 在 https://github.com/kent10636/NoteFlow 应能看到最新 commit
```

---

## 第二步：Railway 数据库

```bash
# 1. 安装 CLI
npm i -g @railway/cli

# 2. 登录（浏览器授权）
railway login

# 3. 创建项目
railway init
# 项目名建议: noteflow-db

# 4. 添加 PostgreSQL
railway add --database postgres

# 5. 获取连接字符串
railway variables
# 复制 DATABASE_URL，格式如:
# postgresql://postgres:xxx@xxx.railway.app:5432/railway
```

### 启用 pgvector 扩展

在 Railway PostgreSQL 控制台 → **Query** 中执行：

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### 初始化数据库 Schema

```bash
# 本地执行（将 Railway DATABASE_URL 填入 .env）
DATABASE_URL="postgresql://..." npx prisma db push
```

---

## 第三步：Vercel 前端部署

### 方式 A — GitHub 导入（推荐，零 CLI）

1. 打开 https://vercel.com/new
2. 导入 `kent10636/NoteFlow` 仓库
3. Framework 自动识别为 **Next.js**
4. 配置环境变量（见 `.env.production.example`）
5. 点击 **Deploy**

### 方式 B — Vercel CLI

```bash
npx vercel login        # 浏览器授权
npx vercel --prod       # 生产部署
```

### Vercel 环境变量配置

在 Vercel Dashboard → Project → Settings → Environment Variables：

| 变量 | 值 | 环境 |
|------|-----|------|
| `DATABASE_URL` | Railway 连接字符串 | Production |
| `AUTH_SECRET` | `openssl rand -base64 32` | Production |
| `NEXTAUTH_SECRET` | 同上 | Production |
| `NEXTAUTH_URL` | `https://你的域名.vercel.app` | Production |
| `XAI_API_KEY` | xAI API Key（可选） | Production |

> 部署后务必更新 `NEXTAUTH_URL` 为实际 Vercel 域名，然后重新 Deploy。

---

## 第四步：验证部署

```bash
# 健康检查
curl https://你的域名.vercel.app/api/health

# 预期响应
# { "status": "healthy", "checks": { "env": true, "database": true } }
```

浏览器访问：

1. 打开部署 URL
2. 注册账号
3. 创建笔记 → 测试 AI 摘要
4. 测试语义搜索

---

## 线上链接占位

部署完成后，更新 `README.md` 中的链接：

| 环境 | 链接 |
|------|------|
| Vercel 生产 | `https://noteflow-xxx.vercel.app` |
| Railway DB | `xxx.railway.app:5432` |
| GitHub | https://github.com/kent10636/NoteFlow |

---

## 常见问题

### `git push` 提示 Authentication failed
- 确认使用 PAT Token 而非 GitHub 密码
- Token 需有 `repo` 权限

### Vercel 构建失败 `prisma generate`
- 确保 `DATABASE_URL` 已在 Vercel 环境变量中配置
- `postinstall` 脚本会自动运行 `prisma generate`

### 登录后 500 错误
- 检查 `NEXTAUTH_URL` 是否与 Vercel 域名一致
- 检查 `AUTH_SECRET` 是否已配置

### 语义搜索不工作
- 确认 Railway 数据库已执行 `CREATE EXTENSION vector;`
- 创建笔记后会自动生成 embedding

### 文件上传失败（Vercel）
- Vercel Serverless 不支持持久化本地文件存储
- 生产环境需接入 Vercel Blob 或 S3（见 known-issues.md）