# NoteFlow 验收清单

## 基础功能

- [x] 项目可本地启动 (`npm run dev`)
- [x] 生产构建通过 (`npm run build`)
- [x] 单元测试通过 (`npm test` — 8/8)
- [x] Git 仓库已初始化

## 用户认证

- [x] 邮箱密码注册 (`POST /api/register`)
- [x] 邮箱密码登录 (NextAuth Credentials)
- [x] Google OAuth 集成（需配置凭据）
- [x] 路由保护中间件（未登录跳转 /login）
- [x] 登录/注册页面 UI

## 笔记 CRUD

- [x] 创建笔记 (`POST /api/notes`)
- [x] 读取笔记列表 (`GET /api/notes`)
- [x] 读取单条笔记 (`GET /api/notes/[id]`)
- [x] 更新笔记 (`PUT /api/notes/[id]`)
- [x] 删除笔记 (`DELETE /api/notes/[id]`)
- [x] Markdown 编辑器（实时预览）
- [x] 笔记列表/卡片展示

## AI 智能功能

- [x] 一键摘要 (`POST /api/ai/summarize`)
- [x] 自动标签 (`POST /api/ai/tags`)
- [x] 相关笔记推荐 (`POST /api/ai/recommend`)
- [x] Grok API 集成 + 本地回退
- [x] 向量嵌入生成

## 语义搜索

- [x] 向量语义搜索 API (`POST /api/search`)
- [x] pgvector 集成
- [x] 文本搜索回退
- [x] 搜索页面 UI

## 知识图谱

- [x] 笔记关联存储 (NoteLink 模型)
- [x] 图谱数据 API (`GET /api/graph`)
- [x] React Flow 可视化
- [x] 知识图谱页面

## UI/UX

- [x] 响应式布局
- [x] 侧边栏导航
- [x] 现代美观界面 (shadcn/ui + Tailwind)
- [x] 落地页
- [x] 仪表盘统计
- [x] Toast 通知

## 部署

- [ ] Vercel 线上部署（需用户授权 Vercel CLI）
- [x] `vercel.json` 配置
- [x] `.env.example` 环境变量模板
- [x] `docker-compose.yml` 数据库配置
- [x] README 文档

## 文档

- [x] `plan.md` 架构规划
- [x] `README.md` 使用说明
- [x] `known-issues.md` 已知问题
- [x] `ACCEPTANCE.md` 验收清单