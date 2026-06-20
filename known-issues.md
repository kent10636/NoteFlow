# 已知问题

> 更新：2026-06-21

## xAI 账户额度不足

- **现象**：API 返回 `403 permission-denied`
- **影响**：AI 摘要/标签/回顾、Vision OCR、高质量 embedding 使用本地回退
- **处理**：在 https://console.x.ai/ 充值，无需改代码

## Preview 环境变量不完整

- CLI 添加 Preview 变量时需交互选分支，部分 Key 可能未写入
- 不影响生产环境

## 技术备注

- Next.js 16 提示 middleware 将迁移至 proxy（当前仅警告）
- Prisma 7 使用 `@prisma/adapter-pg`，需正确配置 `DATABASE_URL`