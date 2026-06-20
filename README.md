# NoteFlow — 智能个人知识笔记 SaaS

AI 驱动的智能笔记管理平台，支持 Markdown 编辑、语义搜索、知识图谱、每日回顾和 OCR 文件上传。

## 项目状态：已上线

| 环境 | 链接 | 状态 |
|------|------|------|
| **生产站点** | [noteflow-mu-three.vercel.app](https://noteflow-mu-three.vercel.app) | ✅ 运行中 |
| **健康检查** | [/api/health](https://noteflow-mu-three.vercel.app/api/health) | ✅ healthy |
| **GitHub** | [github.com/kent10636/NoteFlow](https://github.com/kent10636/NoteFlow) | ✅ Git 自动部署 |
| **数据库** | Prisma Postgres + pgvector | ✅ 已 Claim 保留 |
| **文件存储** | Vercel Blob | ✅ 生产上传已验证 |
| 本地开发 | [localhost:3000](http://localhost:3000) | ✅ |

> 完整状态见 [PROJECT_STATUS.md](./PROJECT_STATUS.md)

## 功能特性

- **用户认证** — 邮箱密码 + Google OAuth（可选）
- **笔记管理** — CRUD + Markdown 实时预览
- **AI 智能助手** — 摘要 / 标签 / 相关推荐（Grok API，Key 已配置待充值）
- **语义搜索** — 向量搜索 + 文本回退
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
npm test                   # 35 tests, 100% 通过
npm run deploy:check       # 部署前检查
npm run check:env          # 环境变量验证
```

## 部署架构

```
用户 → Vercel (Next.js) → Prisma Postgres (pgvector)
              ↓
        Vercel Blob + xAI Grok API
```

### 重新部署

```bash
git push origin main       # 推荐：Git 自动部署
# 或
npx vercel deploy --prod --yes
```

环境变量模板：[.env.production.example](./.env.production.example)（仅含占位符，无真实密钥）

完整指南：[docs/DEPLOY.md](./docs/DEPLOY.md) | 部署报告：[DEPLOYMENT_REPORT.md](./DEPLOYMENT_REPORT.md)

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

## 未来可扩展

- [ ] Vercel Blob 云存储
- [ ] 协作编辑 / 版本历史
- [ ] 导出 PDF / Notion / Obsidian
- [ ] 移动端 PWA
- [ ] pgvector 语义搜索增强

## License

MIT