# NoteFlow — 智能个人知识笔记 SaaS

AI 驱动的智能笔记管理平台，支持 Markdown 编辑、语义搜索、知识图谱、每日回顾和 OCR 文件上传。

## 线上链接

| 环境 | 链接 | 状态 |
|------|------|------|
| 本地开发 | [http://localhost:3000](http://localhost:3000) | ✅ |
| GitHub | [github.com/kent10636/NoteFlow](https://github.com/kent10636/NoteFlow) | ✅ 仓库已创建 |
| Vercel 生产 | [noteflow-mu-three.vercel.app](https://noteflow-mu-three.vercel.app) | ✅ 已部署 |
| 数据库 (Prisma Postgres) | db.prisma.io | ✅ 已连接 |
| 健康检查 | [/api/health](https://noteflow-mu-three.vercel.app/api/health) | ✅ healthy |

## 一键部署（3 步上线）

> 完整图文指南：[docs/DEPLOY.md](./docs/DEPLOY.md)  
> 部署报告：[DEPLOYMENT_REPORT.md](./DEPLOYMENT_REPORT.md)

### 第 1 步：推送代码

```bash
git push -u origin main
```

凭据：Username = `kent10636`，Password = [GitHub PAT Token](https://github.com/settings/tokens)（勾选 `repo` 权限）

### 第 2 步：Railway 数据库

```bash
npm i -g @railway/cli && railway login
railway init && railway add --database postgres
railway variables   # 复制 DATABASE_URL
```

启用 pgvector：`CREATE EXTENSION IF NOT EXISTS vector;`

### 第 3 步：Vercel 部署

```bash
npx vercel login && npx vercel --prod
```

环境变量模板：复制 [.env.production.example](./.env.production.example) 到 Vercel Dashboard。

| 变量 | 必填 | 说明 |
|------|------|------|
| `DATABASE_URL` | ✅ | Railway PostgreSQL 连接字符串 |
| `AUTH_SECRET` | ✅ | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | ✅ | `https://你的域名.vercel.app` |
| `XAI_API_KEY` | ❌ | Grok AI（未配置时用本地回退） |

### 部署前自动检查

```bash
npm run deploy:check   # 构建 + 测试 + 配置检查
npm run check:env      # 环境变量验证
```

### 部署后验证

```bash
curl https://你的域名.vercel.app/api/health
# → { "status": "healthy", "checks": { "env": true, "database": true } }
```

---

## 功能特性

- **用户认证** — 邮箱密码 + Google OAuth
- **笔记管理** — CRUD + Markdown 实时预览
- **AI 智能助手** — 摘要 / 标签 / 相关推荐（Grok API）
- **语义搜索** — pgvector 向量搜索 + 文本回退
- **知识图谱** — React Flow 可视化，标签关联
- **每日 AI 回顾** — 自动生成当日学习总结
- **文件上传 + OCR** — PDF/图片 → 自动提取文字
- **首次启动引导** — 仪表盘 5 步 onboarding

## 本地开发

```bash
npm install
cp .env.example .env
npx prisma dev -d          # 或 docker compose up -d
npx prisma db push
npm run dev                # → http://localhost:3000
```

## 测试

```bash
npm test                   # 全部测试
npm run test:integration   # 集成测试
npm run verify:local       # 本地 API 验证
```

## 项目结构

```
src/
├── app/
│   ├── (auth)/            # 登录/注册
│   ├── dashboard/         # 仪表盘、笔记、搜索、图谱、回顾、上传
│   └── api/               # REST API + health + setup
├── components/            # UI + onboarding 引导
├── lib/                   # Prisma, Auth, AI, OCR, Env
└── stores/                # Zustand
docs/
├── DEPLOY.md              # 完整部署指南
```

## API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/health` | 健康检查（公开） |
| GET | `/api/setup/status` | 引导状态 |
| POST | `/api/register` | 注册 |
| GET/POST | `/api/notes` | 笔记 CRUD |
| POST | `/api/ai/summarize` | AI 摘要 |
| POST | `/api/ai/daily-review` | 每日回顾 |
| POST | `/api/search` | 语义搜索 |
| GET | `/api/graph` | 知识图谱 |
| POST | `/api/upload` | 文件上传 + OCR |

## 已知问题

详见 [known-issues.md](./known-issues.md)

## 未来可扩展功能

- [ ] 协作编辑（多人实时同步）
- [ ] 笔记版本历史与回滚
- [ ] Vercel Blob 云存储集成
- [ ] 导出 PDF / Notion / Obsidian
- [ ] 移动端 PWA
- [ ] Webhook 集成（Slack / Discord）
- [ ] 多语言国际化
- [ ] 笔记端到端加密
- [ ] 高级图谱分析（社区发现、中心性）
- [ ] 自定义 AI Prompt 模板

## License

MIT