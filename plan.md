# NoteFlow — 智能个人知识笔记 SaaS 架构规划

## 1. 项目概述

NoteFlow 是一个智能个人知识管理 SaaS，支持 Markdown 笔记、AI 辅助（摘要/标签/推荐）、语义向量搜索和知识图谱可视化。

## 2. 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | Next.js 15 App Router + TypeScript |
| UI | Tailwind CSS + shadcn/ui |
| 状态管理 | Zustand |
| 知识图谱 | React Flow |
| 编辑器 | @uiw/react-md-editor |
| 认证 | NextAuth.js v5 (Google OAuth + Credentials) |
| ORM | Prisma |
| 数据库 | PostgreSQL + pgvector |
| AI | xAI Grok API (摘要/标签/嵌入) |
| 部署 | Vercel (前端) + Railway (PostgreSQL) |

## 3. 文件夹结构

```
NoteFlow/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx          # 侧边栏布局
│   │   │   ├── page.tsx            # 仪表盘
│   │   │   ├── notes/
│   │   │   │   ├── page.tsx        # 笔记列表
│   │   │   │   ├── new/page.tsx    # 新建笔记
│   │   │   │   └── [id]/page.tsx   # 编辑笔记
│   │   │   ├── search/page.tsx     # 语义搜索
│   │   │   └── graph/page.tsx      # 知识图谱
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   ├── notes/
│   │   │   │   ├── route.ts        # GET/POST
│   │   │   │   └── [id]/route.ts   # GET/PUT/DELETE
│   │   │   ├── ai/
│   │   │   │   ├── summarize/route.ts
│   │   │   │   ├── tags/route.ts
│   │   │   │   └── recommend/route.ts
│   │   │   ├── search/route.ts
│   │   │   └── register/route.ts
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                     # shadcn/ui
│   │   ├── layout/
│   │   │   ├── sidebar.tsx
│   │   │   └── header.tsx
│   │   ├── notes/
│   │   │   ├── note-card.tsx
│   │   │   ├── note-editor.tsx
│   │   │   └── note-list.tsx
│   │   ├── search/
│   │   │   └── search-bar.tsx
│   │   └── graph/
│   │       └── knowledge-graph.tsx
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── auth.ts
│   │   ├── ai.ts                   # Grok API 封装
│   │   ├── embeddings.ts           # 向量嵌入
│   │   └── utils.ts
│   ├── stores/
│   │   └── note-store.ts           # Zustand
│   └── types/
│       └── index.ts
├── __tests__/
│   ├── api/
│   └── lib/
├── docker-compose.yml              # 本地 PostgreSQL + pgvector
├── .env.example
├── package.json
└── README.md
```

## 4. Prisma Schema

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [vector]
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  password      String?   // bcrypt hash for credentials auth
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  accounts      Account[]
  sessions      Session[]
  notes         Note[]
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime
  @@unique([identifier, token])
}

model Note {
  id          String                      @id @default(cuid())
  title       String
  content     String                      @db.Text
  summary     String?                     @db.Text
  tags        String[]                    @default([])
  embedding   Unsupported("vector(1536)")?
  published   Boolean                     @default(false)
  userId      String
  user        User                        @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt   DateTime                    @default(now())
  updatedAt   DateTime                    @updatedAt
  linksFrom   NoteLink[]                  @relation("FromNote")
  linksTo     NoteLink[]                  @relation("ToNote")
  @@index([userId])
}

model NoteLink {
  id         String   @id @default(cuid())
  fromNoteId String
  toNoteId   String
  strength   Float    @default(1.0)
  fromNote   Note     @relation("FromNote", fields: [fromNoteId], references: [id], onDelete: Cascade)
  toNote     Note     @relation("ToNote", fields: [toNoteId], references: [id], onDelete: Cascade)
  createdAt  DateTime @default(now())
  @@unique([fromNoteId, toNoteId])
}
```

## 5. API 设计

### 认证
- `POST /api/register` — 邮箱密码注册
- `GET/POST /api/auth/[...nextauth]` — NextAuth 处理

### 笔记 CRUD
- `GET /api/notes` — 获取当前用户所有笔记
- `POST /api/notes` — 创建笔记
- `GET /api/notes/[id]` — 获取单条笔记
- `PUT /api/notes/[id]` — 更新笔记
- `DELETE /api/notes/[id]` — 删除笔记

### AI 功能
- `POST /api/ai/summarize` — `{ noteId }` → 生成摘要
- `POST /api/ai/tags` — `{ noteId }` → 自动标签
- `POST /api/ai/recommend` — `{ noteId }` → 相关笔记推荐

### 搜索
- `POST /api/search` — `{ query }` → 语义向量搜索

## 6. 分阶段实施计划

### 阶段 1: 项目初始化 (30min)
- [x] 创建 plan.md
- [ ] Next.js 15 项目脚手架
- [ ] Git 初始化
- [ ] 安装依赖 (Prisma, NextAuth, shadcn/ui, Zustand, React Flow)
- [ ] Docker Compose (PostgreSQL + pgvector)

### 阶段 2: 数据库 + 认证 (45min)
- [ ] Prisma Schema + 迁移
- [ ] NextAuth 配置 (Google + Credentials)
- [ ] 注册/登录页面
- [ ] 路由保护中间件

### 阶段 3: 笔记核心 (60min)
- [ ] 笔记 CRUD API
- [ ] Markdown 编辑器组件
- [ ] 笔记列表/详情页面
- [ ] 侧边栏导航布局

### 阶段 4: AI 集成 (45min)
- [ ] Grok API 封装
- [ ] 摘要/标签/推荐 API
- [ ] 前端 AI 操作按钮
- [ ] 向量嵌入生成

### 阶段 5: 搜索 + 图谱 (45min)
- [ ] pgvector 语义搜索
- [ ] 搜索页面
- [ ] React Flow 知识图谱
- [ ] Zustand 状态管理

### 阶段 6: 测试 + 部署 (30min)
- [ ] 单元测试 + 集成测试
- [ ] Vercel 部署
- [ ] Railway PostgreSQL
- [ ] README + 验收清单

## 7. 环境变量

```env
DATABASE_URL=postgresql://noteflow:noteflow@localhost:5432/noteflow
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
XAI_API_KEY=
```

## 8. 部署架构

```
用户 → Vercel (Next.js) → Railway PostgreSQL (pgvector)
                ↓
           xAI Grok API
```