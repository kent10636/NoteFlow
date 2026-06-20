# NoteFlow 已知问题

> 最后更新：2026-06-21

## 部署状态

| 平台 | 状态 | 说明 |
|------|------|------|
| Vercel 生产 | ✅ 已上线 | https://noteflow-mu-three.vercel.app |
| Prisma Postgres | ✅ 已 Claim | 生产数据库已保留 |
| Vercel Blob | ✅ 已接入 | `noteflow-uploads`，生产上传已验证 |
| Vercel Git | ✅ 已连接 | push `main` 自动部署 |
| GitHub | ✅ 已同步 | https://github.com/kent10636/NoteFlow |
| 本地开发 | ✅ 可用 | http://localhost:3000 |

## 环境相关

### 1. pgvector 扩展
- **状态**: ✅ 已启用（v0.8.1）
- **说明**: 新建/更新笔记时自动生成向量嵌入
- **维护**: `npm run db:pgvector`（通过 Vercel 生产环境执行）

### 2. Vercel 文件上传
- **状态**: ✅ 已解决（Vercel Blob）
- **说明**: 生产环境文件写入 `*.public.blob.vercel-storage.com`
- **本地**: 仍使用 `public/uploads/`（已 gitignore）

### 3. xAI Grok API
- **状态**: ⚠️ Key 已配置，账户额度不足
- **现象**: API 返回 `403 permission-denied`（额度用完或达到消费上限）
- **影响**: AI 摘要/标签/回顾、Vision OCR、高质量 embedding 暂用本地回退
- **操作**: 在 https://console.x.ai/ 充值后无需改代码，重新部署或等待下次请求即可
- **维护**: `npm run setup:xai -- <key>` 更新 Key

### 4. Google OAuth
- **状态**: ✅ 已配置并上线
- **说明**: 登录/注册页支持 Google 一键登录，用户写入 Prisma 数据库
- **回调**: `https://noteflow-mu-three.vercel.app/api/auth/callback/google`

### 5. OCR 行为（Serverless）
- **状态**: 已优化，仍有平台限制
- **说明**: 有 `XAI_API_KEY` 时优先 Vision OCR；失败时不再回退慢速 Tesseract（避免上传超时）
- **无 Key / 额度不足**: 图片 OCR 返回提示信息，不会长时间挂起

### 6. Docker 本地环境
- **状态**: 本地可选 Docker 或 `npx prisma dev`
- **影响**: 无，仅影响本地数据库启动方式

## 技术债务

### 7. Next.js Middleware 弃用警告
- Next.js 16 提示 middleware 将迁移至 proxy 模式，当前仅警告

### 8. Prisma 7 Adapter 模式
- 使用 `@prisma/adapter-pg` + `pg`，确保 `DATABASE_URL` 在 Vercel 正确配置

### 9. Preview 环境 XAI Key
- CLI 添加 Preview 环境变量时需交互选择分支，可能未完全写入
- 不影响生产环境