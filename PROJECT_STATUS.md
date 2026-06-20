# NoteFlow 项目状态

> 最后更新：2026-06-21  
> 版本：v1.0.0

## 生产环境（已上线）

| 组件 | 状态 | 地址 |
|------|------|------|
| 前端 (Vercel) | ✅ 运行中 | https://noteflow-mu-three.vercel.app |
| 数据库 (Prisma Postgres) | ✅ 已 Claim 并保留 | 托管于 Prisma Data Platform |
| 文件存储 (Vercel Blob) | ✅ 已接入 | `noteflow-uploads`（sin1，public） |
| 健康检查 | ✅ healthy | https://noteflow-mu-three.vercel.app/api/health |
| 源代码 (GitHub) | ✅ 已同步 | https://github.com/kent10636/NoteFlow |
| Git 自动部署 | ✅ 已连接 | `main` push → 生产部署 |

## 开发环境

| 组件 | 状态 | 说明 |
|------|------|------|
| 本地开发 | ✅ 可用 | `npm run dev` → http://localhost:3000 |
| 单元/集成测试 | ✅ 35/35 通过 | `npm test` |
| 生产构建 | ✅ 通过 | `npm run build` |

## 功能完成度

| 模块 | 状态 |
|------|------|
| 用户认证（邮箱 + Google OAuth 骨架） | ✅ |
| 笔记 CRUD + Markdown 编辑器 | ✅ |
| AI 摘要 / 标签 / 推荐 | ⚠️ Key 已配置，待 xAI 账户充值额度 |
| 语义搜索 | ✅（pgvector v0.8.1 已启用） |
| 知识图谱 (React Flow) | ✅ |
| 每日 AI 回顾 | ⚠️ 依赖 xAI 额度，否则本地回退 |
| 文件上传 + OCR | ✅（生产走 Vercel Blob，已线上实测） |
| 首次启动引导 | ✅ |

## 环境变量（生产）

以下变量已在 Vercel 配置，**值不写入仓库**：

| 变量 | 状态 |
|------|------|
| `DATABASE_URL` | ✅ 已配置 |
| `AUTH_SECRET` | ✅ 已配置 |
| `NEXTAUTH_SECRET` | ✅ 已配置 |
| `NEXTAUTH_URL` | ✅ 已配置 |
| `BLOB_READ_WRITE_TOKEN` | ✅ 已配置 |
| `XAI_API_KEY` | ✅ 已配置（账户额度待充值） |
| `GOOGLE_CLIENT_ID` | ✅ 已配置 |
| `GOOGLE_CLIENT_SECRET` | ✅ 已配置 |

## 近期完成

- [x] 在生产数据库启用 pgvector 扩展（v0.8.1）
- [x] 连接 Vercel Git 自动部署（`kent10636/NoteFlow` → `main`）
- [x] 接入 Vercel Blob 支持生产环境文件上传
- [x] 线上实测上传流程（注册 → 登录 → PDF 上传 → Blob URL 可访问）
- [x] 配置 `XAI_API_KEY` 至 Vercel（Production / Development）

## 待办（可选）

- [ ] xAI 控制台充值额度，启用完整 Grok AI / Vision OCR
- [x] 配置 Google OAuth
- [ ] 绑定自定义域名
- [ ] Preview 环境补全 `XAI_API_KEY`（CLI 交互限制，不影响生产）

## 运维脚本

| 命令 | 说明 |
|------|------|
| `npm run vercel:git-connect` | 重连 GitHub 仓库 |
| `npm run setup:xai -- <key>` | 同步 XAI Key 到 Vercel |
| `npm run db:pgvector` | 生产库启用 pgvector |
| `npm run db:backfill` | 补全笔记嵌入向量 |
| `npm run db:stats` | 生产库统计 |

## 管理入口

| 平台 | 链接 |
|------|------|
| Vercel Dashboard | https://vercel.com/kentshi/noteflow |
| Vercel 环境变量 | https://vercel.com/kentshi/noteflow/settings/environment-variables |
| Vercel Blob 存储 | https://vercel.com/kentshi/noteflow/stores |
| Prisma Data Platform | https://console.prisma.io/ |
| GitHub 仓库 | https://github.com/kent10636/NoteFlow |
| xAI 控制台 | https://console.x.ai/ |