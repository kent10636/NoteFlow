# NoteFlow 已知问题

## 环境相关

### 1. Docker 不可用
- **状态**: 本地未安装 Docker
- **影响**: 无法使用 `docker-compose.yml` 启动 PostgreSQL
- **替代方案**: 使用 `npx prisma dev -d` 启动 Prisma 内置开发数据库
- **生产建议**: 使用 Railway / Neon / Supabase 托管 PostgreSQL + pgvector

### 2. pgvector 扩展
- **状态**: Prisma Dev 本地数据库可能未预装 pgvector
- **影响**: 语义向量搜索会回退到文本关键词搜索
- **解决方案**: 在生产数据库执行 `CREATE EXTENSION IF NOT EXISTS vector;`
- **脚本**: `npx tsx scripts/enable-pgvector.ts`（需配置 DATABASE_URL）

### 3. Google OAuth
- **状态**: 未配置 `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
- **影响**: Google 登录按钮不可用
- **解决方案**: 在 [Google Cloud Console](https://console.cloud.google.com/) 创建 OAuth 凭据

### 4. xAI Grok API
- **状态**: 未配置 `XAI_API_KEY`
- **影响**: AI 功能使用本地回退逻辑（简单摘要/关键词标签）
- **解决方案**: 在 [xAI Console](https://console.x.ai/) 获取 API Key 并设置环境变量

## 技术债务

### 5. Next.js Middleware 弃用警告
- **描述**: Next.js 16 提示 middleware 约定已弃用，建议使用 proxy
- **影响**: 仅警告，不影响功能
- **计划**: 后续迁移到 Next.js proxy 模式

### 6. Prisma 7 配置变更
- **描述**: Prisma 7 要求使用 adapter 模式连接数据库
- **影响**: 需要 `@prisma/adapter-pg` + `pg` 包
- **注意**: 部署时需确保 DATABASE_URL 正确配置

## 部署注意事项

- Vercel 部署需要配置所有环境变量（见 `.env.example`）
- 数据库必须支持 PostgreSQL + pgvector 扩展
- 首次部署后需运行 `npx prisma db push` 或 `prisma migrate deploy`