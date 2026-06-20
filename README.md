# NoteFlow

智能个人知识笔记 — Markdown 编辑、双向链接、混合搜索、知识图谱、AI 辅助。

**在线演示**：https://noteflow-kent.vercel.app

## 功能一览

笔记 CRUD · 双向链接 `[[笔记名]]` · 反向链接 · 模板 · 标签 · 批量操作 · 导入导出 · 公开分享 · 语义搜索 · 知识图谱 · AI 摘要/标签/推荐/每日回顾 · 文件上传 OCR · Chrome 剪藏 · Google 登录

## 快速开始

需要 Node.js 20+ 和 PostgreSQL。

```bash
npm install
cp .env.example .env      # 填写 DATABASE_URL、NEXTAUTH_SECRET、NEXTAUTH_URL
npx prisma dev -d         # 或 docker compose up -d
npx prisma db push
npm run check:env
npm run dev               # http://localhost:3000
```

可选能力：`XAI_API_KEY`（AI）、`GOOGLE_CLIENT_*`（Google 登录）、`BLOB_READ_WRITE_TOKEN`（上传）。详见 `.env.example` 与 [docs/DEPLOY.md](./docs/DEPLOY.md)。

## 常用命令

```bash
npm run dev          # 本地开发
npm test             # 运行测试
npm run build        # 生产构建
npm run check:env    # 检查环境变量
```

更多脚本（测试分组、部署、数据库）见 `package.json` 或 [docs/TEST-COVERAGE.md](./docs/TEST-COVERAGE.md)。

## 部署

推送到 `main` 分支即可触发 Vercel 自动部署。运维细节见 [docs/DEPLOY.md](./docs/DEPLOY.md)。

## Chrome 剪藏

1. 在 `/dashboard/settings` 生成剪藏令牌
2. Chrome 加载 `extension/` 目录（开发者模式）
3. 填入站点地址与令牌，即可剪藏当前网页

## 更多文档

| 文档 | 内容 |
|------|------|
| [docs/DEPLOY.md](./docs/DEPLOY.md) | 部署与环境变量 |
| [docs/TEST-COVERAGE.md](./docs/TEST-COVERAGE.md) | 测试与 API 路由清单 |
| [known-issues.md](./known-issues.md) | 已知限制 |

## License

MIT