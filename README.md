# NoteFlow

智能个人知识笔记，支持 Markdown 编辑、混合搜索、知识图谱与 AI 辅助。

**生产站点**：https://noteflow-mu-three.vercel.app

## 功能

| 模块 | 说明 |
|------|------|
| 认证 | 邮箱密码 + Google OAuth |
| 笔记 | CRUD、Markdown 编辑器、双向链接 `[[笔记名]]` |
| 导入导出 | JSON 备份 / Markdown 合集 |
| 公开分享 | `/share/[id]` 只读链接 |
| 搜索 | 关键词 + 语义混合搜索（pgvector） |
| 知识图谱 | React Flow，笔记关联与标签聚类 |
| 上传 | PDF/图片 → Vercel Blob，可选自动建笔记 + OCR |
| AI | 摘要 / 标签 / 推荐 / 每日回顾（Grok，需 xAI 额度） |

## 快速开始

```bash
npm install
cp .env.example .env
npx prisma dev -d          # 或 docker compose up -d
npx prisma db push
npm run dev                # http://localhost:3000
```

## 常用命令

```bash
npm test                   # 84 tests
npm run build
npm run check:env
npm run deploy:check
npm run verify:google      # 验证 Google OAuth
```

## 部署

```bash
git push origin main       # Vercel 自动部署
```

环境变量模板：`.env.production.example`（仅占位符）

完整运维说明：[docs/DEPLOY.md](./docs/DEPLOY.md)

## API 概览

| 路径 | 说明 |
|------|------|
| `GET /api/health` | 健康检查 |
| `GET/POST /api/notes` | 笔记 CRUD |
| `GET /api/notes/export` | 导出 JSON / Markdown |
| `POST /api/notes/import` | 导入 |
| `POST /api/search` | 混合搜索 |
| `GET /api/graph` | 知识图谱数据 |
| `POST /api/upload` | 文件上传 |
| `GET /share/[id]` | 公开笔记页 |

## 架构

```
用户 → Vercel (Next.js 16) → Prisma Postgres (pgvector)
              ↓
        Vercel Blob + xAI Grok API
```

## 已知限制

- xAI Key 已配置，账户额度不足时 AI/OCR 使用本地回退
- 详见 [known-issues.md](./known-issues.md)

## License

MIT