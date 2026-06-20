# 已知问题与限制

> 返回 [README](README.md) · 部署排障见 [docs/DEPLOY.md](docs/DEPLOY.md)

反馈问题时请脱敏：不要粘贴 `.env` 内容、数据库 URL、API 密钥、剪藏令牌或用户数据。

## xAI 额度不足

- **现象**：API 返回 `403 permission-denied`
- **影响**：AI 摘要/标签/回顾、Vision OCR、高质量 embedding 降级为本地回退
- **处理**：在 [xAI Console](https://console.x.ai/) 充值或提升额度，无需改代码

## 可选服务未配置

| 服务 | 未配置时的行为 |
|------|----------------|
| `XAI_API_KEY` | AI 与 Vision OCR 使用本地启发式回退 |
| `BLOB_READ_WRITE_TOKEN` | 上传 API 返回 503 |
| `GOOGLE_CLIENT_*` | 仅邮箱密码登录可用 |

## 本地开发

- **Prisma Client 缓存**：修改 `schema.prisma` 后执行 `npx prisma generate` 并重启 dev server，否则可能出现 `Unknown field` 错误
- **env 覆盖**：本地 `.env` / `.env.local` 的 `DATABASE_URL` 会覆盖 `vercel env run` 注入的生产连接；操作生产库请用 `npm run db:push:production`

## 平台备注

- Next.js 16 提示 middleware 将迁移至 proxy（当前仅警告，不影响功能）
- Prisma 7 使用 `@prisma/adapter-pg`，需正确配置 `DATABASE_URL`
- 生产 schema 由构建时 `prisma db push` + 运行时 `ensureSchema()` 双重保障
- Vercel Preview 环境变量可能不完整，不影响 Production