# NoteFlow 已知问题

## 环境相关

### 1. Docker 不可用
- **状态**: 本地未安装 Docker
- **影响**: 无法使用 `docker-compose.yml` 启动 PostgreSQL
- **替代方案**: 使用 `npx prisma dev -d` 启动 Prisma 内置开发数据库
- **生产建议**: 使用 Railway / Neon 托管 PostgreSQL + pgvector

### 2. pgvector 扩展
- **状态**: Prisma Dev 本地数据库可能未预装 pgvector
- **影响**: 语义向量搜索会回退到文本关键词搜索
- **解决方案**: 在生产数据库执行 `CREATE EXTENSION IF NOT EXISTS vector;`

### 3. Vercel 文件上传限制
- **状态**: Vercel Serverless 函数有只读文件系统
- **影响**: `public/uploads/` 本地存储在 Vercel 上不可用
- **解决方案**: 生产环境需接入 Vercel Blob / AWS S3 / Cloudinary

### 4. Google OAuth
- **状态**: 需用户自行配置 `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
- **影响**: Google 登录按钮不可用（邮箱登录正常）

### 5. xAI Grok API
- **状态**: 需用户配置 `XAI_API_KEY`
- **影响**: AI 功能使用本地回退逻辑；OCR 使用 Tesseract 离线引擎

## 技术债务

### 6. Next.js Middleware 弃用警告
- Next.js 16 提示 middleware 约定将迁移至 proxy 模式，当前仅警告

### 7. Prisma 7 Adapter 模式
- 需 `@prisma/adapter-pg` + `pg` 包，部署时确保 `DATABASE_URL` 正确

### 8. Tesseract OCR 语言包
- 首次 OCR 会下载 `chi_sim+eng` 语言包，可能较慢
- 无网络时 OCR 功能受限

## 部署状态

| 平台 | 状态 | 说明 |
|------|------|------|
| 本地 | ✅ 可用 | http://localhost:3000 |
| Vercel | ⏳ 待授权 | 需 `vercel login` 或 GitHub 导入 |
| Railway | ⏳ 待授权 | 需 `railway login` + 创建 PostgreSQL 服务 |