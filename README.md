# NoteFlow — 智能个人知识笔记 SaaS

AI 驱动的智能笔记管理平台，支持 Markdown 编辑、语义搜索、知识图谱和 Grok AI 辅助。

## 功能特性

- **用户认证** — 邮箱密码注册/登录 + Google OAuth
- **笔记管理** — 完整 CRUD + Markdown 富文本编辑器
- **AI 智能助手** — 一键摘要、自动标签、相关笔记推荐（Grok API）
- **语义搜索** — 基于 pgvector 的向量语义搜索
- **知识图谱** — React Flow 可视化笔记关联网络
- **现代 UI** — shadcn/ui + Tailwind CSS 响应式设计

## 技术栈

| 技术 | 用途 |
|------|------|
| Next.js 16 (App Router) | 全栈框架 |
| TypeScript | 类型安全 |
| Tailwind CSS + shadcn/ui | UI 组件 |
| Prisma 7 + PostgreSQL | ORM + 数据库 |
| pgvector | 向量搜索 |
| NextAuth.js v5 | 认证 |
| Zustand | 状态管理 |
| React Flow | 知识图谱 |
| xAI Grok API | AI 功能 |

## 快速开始

### 前置要求

- Node.js 20+
- PostgreSQL 16+（含 pgvector 扩展）

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 填入你的配置
```

### 3. 启动数据库

**方式 A — Docker（推荐）**

```bash
docker compose up -d
```

**方式 B — Prisma Dev（无需 Docker）**

```bash
npx prisma dev -d
# 将输出的 DATABASE_URL 更新到 .env
```

### 4. 初始化数据库

```bash
npx prisma db push
npx tsx scripts/enable-pgvector.ts  # 启用向量扩展
```

### 5. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

## 环境变量

| 变量 | 必填 | 说明 |
|------|------|------|
| `DATABASE_URL` | 是 | PostgreSQL 连接字符串 |
| `AUTH_SECRET` | 是 | NextAuth 密钥 (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | 是 | 应用 URL |
| `GOOGLE_CLIENT_ID` | 否 | Google OAuth |
| `GOOGLE_CLIENT_SECRET` | 否 | Google OAuth |
| `XAI_API_KEY` | 否 | xAI Grok API（未配置时使用本地回退） |

## 项目结构

```
src/
├── app/                  # Next.js App Router 页面和 API
│   ├── (auth)/           # 登录/注册
│   ├── dashboard/        # 仪表盘、笔记、搜索、图谱
│   └── api/              # REST API 端点
├── components/           # React 组件
├── lib/                  # 工具库（Prisma, Auth, AI）
├── stores/               # Zustand 状态
└── types/                # TypeScript 类型
```

## API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/register` | 用户注册 |
| GET/POST | `/api/notes` | 笔记列表/创建 |
| GET/PUT/DELETE | `/api/notes/[id]` | 笔记详情/更新/删除 |
| POST | `/api/ai/summarize` | AI 摘要 |
| POST | `/api/ai/tags` | AI 标签 |
| POST | `/api/ai/recommend` | AI 推荐 |
| POST | `/api/search` | 语义搜索 |
| GET | `/api/graph` | 知识图谱数据 |

## 测试

```bash
npm test          # 运行所有测试
npm run test:watch  # 监听模式
```

## 部署

### Vercel（前端）

1. 将项目推送到 GitHub
2. 在 [Vercel](https://vercel.com) 导入项目
3. 配置环境变量
4. 部署

或使用 CLI：

```bash
npx vercel --prod
```

### 数据库（Railway / Neon）

1. 创建 PostgreSQL 实例（确保支持 pgvector）
2. 执行 `CREATE EXTENSION IF NOT EXISTS vector;`
3. 将 `DATABASE_URL` 配置到 Vercel 环境变量
4. 部署后运行 `npx prisma db push`

## 部署链接

> 本地开发: [http://localhost:3000](http://localhost:3000)
>
> 生产部署: 需要配置 Vercel + 数据库后获取链接

## 已知问题

详见 [known-issues.md](./known-issues.md)

## 验收清单

详见 [ACCEPTANCE.md](./ACCEPTANCE.md)

## License

MIT