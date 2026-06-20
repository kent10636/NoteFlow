# NoteFlow

智能个人知识笔记，支持 Markdown 编辑、混合搜索、知识图谱与 AI 辅助。

**生产站点**：https://noteflow-mu-three.vercel.app

## 功能

### 笔记

| 模块 | 说明 |
|------|------|
| 笔记 | CRUD、Markdown 编辑器、双向链接 `[[笔记名]]`、自动补全 |
| 反向链接 | 编辑页展示链接到当前笔记的其他笔记 |
| 笔记模板 | 新建页可选：空白 / 会议 / 读书 / 周报 |
| 标签管理 | 统计、重命名、合并，支持按标签筛选笔记 |
| 批量操作 | 笔记列表多选：删除、添加/移除标签 |
| 导入导出 | JSON 备份 / Markdown 合集 |
| 公开分享 | `/share/[id]` 只读页面 |

### 搜索与图谱

| 模块 | 说明 |
|------|------|
| 搜索 | 关键词 + 语义混合搜索（pgvector） |
| 知识图谱 | React Flow，笔记关联与标签聚类 |

### AI 与媒体

| 模块 | 说明 |
|------|------|
| AI | 摘要 / 标签 / 推荐 / 每日回顾（Grok，需 xAI 额度） |
| 上传 | PDF/图片 → Vercel Blob，可选自动建笔记 + OCR |

### 集成

| 模块 | 说明 |
|------|------|
| 认证 | 邮箱密码 + Google OAuth |
| 浏览器剪藏 | Chrome 扩展 + 剪藏令牌（`/dashboard/settings`） |
| 新手引导 | 首次使用步骤向导（`/api/setup/status`） |

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Next.js 16、React 19、TypeScript |
| 数据 | Prisma 7、PostgreSQL + pgvector |
| 认证 | NextAuth v5（JWT + Credentials / Google OAuth） |
| 存储 | Vercel Blob（文件上传） |
| AI | xAI Grok API（可选，无额度时本地回退） |
| 测试 | Vitest、Testing Library（[覆盖说明](./docs/TEST-COVERAGE.md)） |

## 目录结构

```
src/
  app/           # 页面与 API 路由
  components/    # UI 与业务组件
  lib/           # 核心业务逻辑
  stores/        # Zustand 状态
extension/       # Chrome 剪藏扩展
__tests__/       # 单元 / 组件 / 集成测试
docs/            # 部署、测试等文档
scripts/         # 运维与校验脚本
```

## 快速开始

### 环境要求

- Node.js 20+
- PostgreSQL（生产需启用 pgvector 扩展）

### 本地开发

```bash
npm install
cp .env.example .env

# 生成密钥（填入 .env 的 NEXTAUTH_SECRET / AUTH_SECRET）
openssl rand -base64 32

# 启动数据库并同步 schema
npx prisma dev -d          # 或 docker compose up -d
npx prisma db push

# 校验必填环境变量
npm run check:env

npm run dev                # http://localhost:3000
```

### 环境变量

| 变量 | 必填 | 说明 |
|------|------|------|
| `DATABASE_URL` | ✅ | PostgreSQL 连接串 |
| `NEXTAUTH_SECRET` / `AUTH_SECRET` | ✅ | 会话加密密钥 |
| `NEXTAUTH_URL` | ✅ | 应用地址，本地为 `http://localhost:3000` |
| `XAI_API_KEY` | 推荐 | AI 摘要/标签/推荐/OCR；未配置时使用本地回退 |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | 可选 | Google 登录 |
| `BLOB_READ_WRITE_TOKEN` | 可选 | 文件上传；未配置时上传 API 返回 503 |

完整生产模板见 [`.env.production.example`](./.env.production.example)。

## 常用命令

```bash
# 开发
npm run dev
npm run build
npm run lint
npm run check:env
npm run verify:local

# 测试（详见 docs/TEST-COVERAGE.md）
npm test
npm run test:watch
npm run test:api
npm run test:lib
npm run test:components
npm run test:integration
npm run test:extension
npm run test:stores

# 部署与数据库
npm run deploy:check
npm run verify:google
npm run db:push:production   # 手动同步生产 schema
```

## 部署

```bash
git push origin main       # Vercel 自动部署（构建时 prisma generate + db push）
```

构建命令：`prisma generate && prisma db push --accept-data-loss && next build`

生产环境通过 `ensureSchema()` 在运行时自愈缺失的数据库列（如 `clipToken`）。

完整运维说明：[docs/DEPLOY.md](./docs/DEPLOY.md)

## 文档

| 文档 | 说明 |
|------|------|
| [docs/DEPLOY.md](./docs/DEPLOY.md) | 部署、环境变量、数据库运维 |
| [docs/TEST-COVERAGE.md](./docs/TEST-COVERAGE.md) | 测试覆盖地图与验收记录 |
| [known-issues.md](./known-issues.md) | 已知问题与限制 |

## 浏览器剪藏扩展

1. 在 **设置** 页（`/dashboard/settings`）生成剪藏令牌
2. Chrome → 扩展程序 → 开发者模式 → 加载 `extension/` 文件夹
3. 填入 NoteFlow 地址（如 `https://noteflow-mu-three.vercel.app`）与令牌
4. 在任意网页点击扩展图标即可剪藏

## API 概览

### 认证与健康

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/api/register` | 邮箱注册 |
| `*` | `/api/auth/*` | NextAuth 登录 / OAuth 回调 |
| `GET` | `/api/health` | 健康检查（含 schema 自检） |
| `GET` | `/api/setup/status` | 新手引导完成状态 |

### 笔记

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` / `POST` | `/api/notes` | 列表 / 创建 |
| `GET` / `PUT` / `DELETE` | `/api/notes/[id]` | 读取 / 更新 / 删除 |
| `POST` | `/api/notes/batch` | 批量删除 / 添加/移除标签 |
| `GET` | `/api/notes/[id]/backlinks` | 反向链接 |
| `GET` | `/api/notes/titles` | 标题列表（wikilink 补全） |
| `GET` | `/api/notes/export` | 导出 JSON / Markdown |
| `POST` | `/api/notes/import` | 导入 JSON / Markdown |

### 搜索、图谱与 AI

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/api/search` | 混合搜索 |
| `GET` | `/api/graph` | 知识图谱数据 |
| `POST` | `/api/ai/summarize` | AI 摘要 |
| `POST` | `/api/ai/tags` | AI 标签 |
| `POST` | `/api/ai/recommend` | AI 相关推荐 |
| `GET` / `POST` | `/api/ai/daily-review` | 每日回顾 |

### 标签、上传与剪藏

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` / `POST` | `/api/tags` | 标签统计 / 重命名 / 合并 |
| `POST` | `/api/upload` | 文件上传（限流 + OCR） |
| `GET` / `POST` | `/api/clip-token` | 剪藏令牌管理 |
| `POST` | `/api/clip` | 浏览器扩展剪藏（Bearer 鉴权） |

### 公开页面

| 路径 | 说明 |
|------|------|
| `/share/[id]` | 已发布笔记的只读分享页（非 API） |

## 架构

```
用户 → Vercel (Next.js 16) → Prisma Postgres (pgvector)
              ↓
        混合搜索：关键词 + 向量嵌入
              ↓
        Vercel Blob（上传）+ xAI Grok（AI/OCR，可回退）
              ↓
        Chrome 扩展 → POST /api/clip
```

关键机制：

- **Schema 自愈**：`ensureSchema()` 在健康检查与登录时自动补齐缺失列
- **限流**：注册 / 上传等接口有 IP + 用户级速率限制
- **AI 回退**：xAI 额度不足时摘要、标签、OCR 使用本地启发式逻辑

## 已知限制

- xAI Key 已配置但额度不足时，AI / Vision OCR 使用本地回退
- 文件上传依赖 Vercel Blob，未配置时上传不可用
- 详见 [known-issues.md](./known-issues.md)

## License

MIT