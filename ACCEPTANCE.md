# NoteFlow 最终验收清单

## 测试 (25/25 = 100%)

- [x] 单元测试 — AI、日期、嵌入向量
- [x] 集成测试 — API 验证规则
- [x] 图谱逻辑测试 — 标签关联边生成
- [x] 每日回顾测试
- [x] 注册验证测试

## 核心功能验证

- [x] 落地页加载 (200)
- [x] 登录页加载 (200)
- [x] 用户注册 API
- [x] 笔记 CRUD API
- [x] AI 摘要/标签/推荐 API
- [x] 语义搜索 API
- [x] 生产构建通过

## 新增功能

- [x] 知识图谱增强 — 标签色、点击跳转、标签关联虚线、图例
- [x] 每日 AI 回顾页面 (`/dashboard/review`)
- [x] 文件上传 + OCR (`/dashboard/upload`)
- [x] 笔记编辑器内嵌上传

## 代码质量

- [x] TypeScript 严格模式通过
- [x] Edge 中间件兼容（auth.config 分离）
- [x] Prisma 7 adapter 模式
- [x] 响应式 UI + shadcn/ui

## 部署

- [x] `vercel.json` 配置
- [x] `railway.toml` 配置
- [x] `docker-compose.yml`
- [x] `.env.example`
- [ ] Vercel 线上链接（需用户授权 CLI）
- [ ] Railway 数据库链接（需用户授权 CLI）

## 文档

- [x] README.md（部署指南、未来扩展）
- [x] known-issues.md
- [x] ACCEPTANCE.md
- [x] plan.md