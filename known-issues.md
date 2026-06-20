# 已知问题

> 更新：2026-06-21

## xAI 账户额度不足

- **现象**：API 返回 `403 permission-denied`
- **影响**：AI 摘要/标签/回顾、Vision OCR、高质量 embedding 使用本地回退
- **处理**：在 https://console.x.ai/ 充值，无需改代码

## Preview 环境变量不完整

- CLI 添加 Preview 变量时需交互选分支，部分 Key 可能未写入
- 不影响生产环境

## 本地开发注意事项

- **Prisma Client 缓存**：修改 `schema.prisma` 后需执行 `npx prisma generate` 并重启 dev server，否则可能出现 `Unknown field` 类错误
- **本地 env 覆盖**：`.env` / `.env.local` 中的 `DATABASE_URL` 指向本地库，会覆盖 `vercel env run` 注入的生产连接串；手动操作生产库请用 `npm run db:push:production`

## 技术备注

- Next.js 16 提示 middleware 将迁移至 proxy（当前仅警告）
- Prisma 7 使用 `@prisma/adapter-pg`，需正确配置 `DATABASE_URL`
- 生产 schema 由构建时 `prisma db push` + 运行时 `ensureSchema()` 双重保障