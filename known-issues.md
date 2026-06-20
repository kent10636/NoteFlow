# NoteFlow 已知问题

## 部署状态（2026-06-20）

| 平台 | 状态 | 说明 |
|------|------|------|
| Vercel 生产 | ✅ 已上线 | https://noteflow-mu-three.vercel.app |
| Prisma Postgres | ✅ 已 Claim | 生产数据库已保留 |
| GitHub | ✅ 已同步 | 代码持续推送 |
| 本地开发 | ✅ 可用 | http://localhost:3000 |

## 环境相关

### 1. pgvector 扩展
- **状态**: ✅ 已启用（v0.8.1）
- **说明**: 新建/更新笔记时自动生成向量嵌入
- **维护**: `npm run db:pgvector`（通过 Vercel 生产环境执行）

### 2. Vercel 文件上传限制
- **状态**: Serverless 函数文件系统只读
- **影响**: `public/uploads/` 在 Vercel 上不可用
- **解决方案**: 接入 Vercel Blob / AWS S3 / Cloudinary

### 3. Google OAuth
- **状态**: 未配置 `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
- **影响**: Google 登录不可用（邮箱登录正常）

### 4. xAI Grok API
- **状态**: 未配置 `XAI_API_KEY`
- **影响**: AI 功能使用本地回退逻辑

### 5. Docker 本地环境
- **状态**: 本地可选 Docker 或 `npx prisma dev`
- **影响**: 无，仅影响本地数据库启动方式

## 技术债务

### 6. Next.js Middleware 弃用警告
- Next.js 16 提示 middleware 将迁移至 proxy 模式，当前仅警告

### 7. Prisma 7 Adapter 模式
- 使用 `@prisma/adapter-pg` + `pg`，确保 `DATABASE_URL` 在 Vercel 正确配置

### 8. Tesseract OCR 语言包
- 首次 OCR 需下载语言包，Serverless 环境可能较慢