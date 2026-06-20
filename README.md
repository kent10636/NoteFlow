# NoteFlow — 智能个人知识笔记 SaaS

AI 驱动的智能笔记管理平台，支持 Markdown 编辑、语义搜索、知识图谱、每日回顾和 OCR 文件上传。

## 部署链接

| 环境 | 链接 | 状态 |
|------|------|------|
| 本地开发 | [http://localhost:3000](http://localhost:3000) | ✅ 运行中 |
| Vercel 生产 | 待部署 — 见下方部署指南 | ⏳ |
| Railway 数据库 | 待部署 — 见下方部署指南 | ⏳ |

## 功能特性

- **用户认证** — 邮箱密码 + Google OAuth
- **笔记管理** — CRUD + Markdown 实时预览编辑器
- **AI 智能助手** — 摘要 / 自动标签 / 相关推荐（Grok API）
- **语义搜索** — pgvector 向量搜索 + 文本回退
- **知识图谱** — React Flow 可视化，支持点击跳转、标签关联
- **每日 AI 回顾** — 自动生成当日学习总结
- **文件上传 + OCR** — PDF/图片上传，Tesseract + Grok Vision 提取文字

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 配置环境
cp .env.example .env

# 3. 启动数据库（二选一）
docker compose up -d          # Docker
npx prisma dev -d             # Prisma Dev（无需 Docker）

# 4. 同步数据库
npx prisma db push

# 5. 启动
npm run dev
# → http://localhost:3000
```

## 环境变量

| 变量 | 必填 | 说明 |
|------|------|------|
| `DATABASE_URL` | ✅ | PostgreSQL 连接字符串 |
| `AUTH_SECRET` | ✅ | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | ✅ | 应用 URL |
| `XAI_API_KEY` | ❌ | Grok AI（未配置时用本地回退） |
| `GOOGLE_CLIENT_ID` | ❌ | Google OAuth |
| `GOOGLE_CLIENT_SECRET` | ❌ | Google OAuth |

## 部署指南

### Vercel（前端）

```bash
# 方式 1: CLI
npx vercel login
npx vercel --prod

# 方式 2: GitHub 导入
# 1. 推送代码到 GitHub
# 2. 在 vercel.com 导入仓库
# 3. 配置环境变量
# 4. Deploy
```

### Railway（数据库）

```bash
# 1. 安装 CLI
npm i -g @railway/cli

# 2. 登录并创建项目
railway login
railway init

# 3. 添加 PostgreSQL
railway add --plugin postgresql

# 4. 获取连接字符串
railway variables

# 5. 启用 pgvector
# 在 Railway PostgreSQL 控制台执行:
# CREATE EXTENSION IF NOT EXISTS vector;

# 6. 将 DATABASE_URL 配置到 Vercel 环境变量
```

### 部署后初始化

```bash
npx prisma db push
```

## 测试

```bash
npm test                # 全部测试 (25 tests)
npm run test:integration  # 集成测试
npm run verify:local    # 本地 API 验证
```

**当前测试通过率: 100% (25/25)**

## 项目结构

```
src/
├── app/
│   ├── (auth)/          # 登录/注册
│   ├── dashboard/       # 仪表盘、笔记、搜索、图谱、回顾、上传
│   └── api/             # REST API
├── components/          # UI 组件
├── lib/                 # Prisma, Auth, AI, OCR, Embeddings
└── stores/              # Zustand 状态
```

## API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/register` | 注册 |
| GET/POST | `/api/notes` | 笔记列表/创建 |
| GET/PUT/DELETE | `/api/notes/[id]` | 笔记 CRUD |
| POST | `/api/ai/summarize` | AI 摘要 |
| POST | `/api/ai/tags` | AI 标签 |
| POST | `/api/ai/recommend` | AI 推荐 |
| GET/POST | `/api/ai/daily-review` | 每日回顾 |
| POST | `/api/search` | 语义搜索 |
| GET | `/api/graph` | 知识图谱 |
| POST | `/api/upload` | 文件上传 + OCR |

## 已知问题

详见 [known-issues.md](./known-issues.md)

## 未来可扩展功能

- [ ] 协作编辑（多人实时同步）
- [ ] 笔记版本历史与回滚
- [ ] 自定义 AI Prompt 模板
- [ ] 导出为 PDF / Notion / Obsidian
- [ ] 移动端 PWA 适配
- [ ] Webhook 集成（Slack / Discord 通知）
- [ ] 多语言界面国际化
- [ ] 笔记加密与端到端安全
- [ ] Vercel Blob 云存储集成
- [ ] 高级知识图谱分析（社区发现、中心性）

## License

MIT