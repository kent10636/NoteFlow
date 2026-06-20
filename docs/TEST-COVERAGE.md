# NoteFlow 测试覆盖说明

最后更新：2026-06-21 · **386 tests** · 74 test files · 全部通过

## 运行测试

```bash
npm test                   # 全量（386）
npm run test:api           # API 路由
npm run test:lib           # 工具库
npm run test:components    # React 组件
npm run test:integration   # 功能矩阵 & 校验规则
npx vitest run __tests__/extension   # 浏览器扩展
npx vitest run __tests__/stores      # Zustand store
npx vitest run __tests__/middleware.test.ts
```

## 覆盖总览

| 层级 | 文件数 | 测试数 | 状态 |
|------|--------|--------|------|
| API 路由 (`src/app/api/**`) | 20/21 | ~120 | ✅ 除 NextAuth 薄封装外全覆盖 |
| 工具库 (`src/lib/**`) | 24/25 | ~130 | ✅ 除 `prisma.ts` 薄封装外全覆盖 |
| 组件 (`src/components/**`) | 18/30+ | ~70 | ✅ 所有含业务逻辑的组件 |
| 基础设施 | 3/3 | ~22 | ✅ middleware、note-store、utils |
| 浏览器扩展 (`extension/`) | 2/2 模块 | 11 | ✅ page-data、config |
| 页面 (`src/app/**/page.tsx`) | 0 | 0 | ⏭ 建议 E2E，单测 ROI 低 |

功能矩阵：`__tests__/integration/feature-matrix.test.ts` 覆盖 **14 个功能域**，每个域至少 1 个测试文件。

## API 路由覆盖

| 路由 | 测试文件 | 覆盖要点 |
|------|----------|----------|
| `/api/register` | `register-route.test.ts` | 429/400/409/201 |
| `/api/health` | `health-route.test.ts` | healthy/degraded |
| `/api/notes` | `notes-route.test.ts` | GET 列表、POST 创建 |
| `/api/notes/[id]` | `notes-id-route.test.ts` | GET/PUT/DELETE |
| `/api/notes/titles` | `notes-titles-route.test.ts` | 标题列表 |
| `/api/notes/import` | `notes-import-route.test.ts` | JSON/Markdown/multipart |
| `/api/notes/export` | `notes-export-route.test.ts` | JSON/Markdown 下载 |
| `/api/notes/batch` | `batch.test.ts` | 批量删/标签 |
| `/api/notes/[id]/backlinks` | `backlinks.test.ts` | 反向链接 |
| `/api/search` | `search-route.test.ts` | 混合搜索 |
| `/api/graph` | `graph-route.test.ts` | 图谱数据 |
| `/api/upload` | `upload-route.test.ts` | 限流/OCR/自动建笔记 |
| `/api/tags` | `tags.test.ts` | 标签 CRUD |
| `/api/clip` | `clip.test.ts` | 浏览器剪藏 |
| `/api/clip-token` | `clip-token.test.ts` | 令牌管理 |
| `/api/setup/status` | `setup-status-route.test.ts` | 新手引导状态 |
| `/api/ai/summarize` | `ai-summarize-route.test.ts` | AI 摘要 |
| `/api/ai/tags` | `ai-tags-route.test.ts` | AI 标签 |
| `/api/ai/recommend` | `ai-recommend-route.test.ts` | AI 推荐 |
| `/api/ai/daily-review` | `ai-daily-review-route.test.ts` | 每日回顾 |
| `/api/auth/[...nextauth]` | — | NextAuth 官方 handlers，无独立单测 |

## 工具库覆盖

| 模块 | 测试文件 |
|------|----------|
| `ai.ts` | `ai.test.ts`, `ai-extended.test.ts` |
| `auth.config.ts` / credentials | `auth-config.test.ts`, `auth-credentials.test.ts` |
| `wikilink.ts` | `wikilink.test.ts`, `wikilink-sync.test.ts` |
| `wikilink-autocomplete.ts` | `wikilink-autocomplete.test.ts` |
| `note-io.ts` | `note-io.test.ts` |
| `hybrid-search.ts` | `hybrid-search.test.ts` |
| `embeddings.ts` | `embeddings.test.ts` |
| `ocr.ts` | `ocr.test.ts` |
| `upload-note.ts` | `upload-note.test.ts` |
| `storage.ts` | `storage.test.ts` |
| `clip-auth.ts` / `clip-note.ts` | `clip-auth.test.ts`, `clip-note.test.ts` |
| `rate-limit.ts` | `rate-limit.test.ts` |
| `ensure-schema.ts` | `ensure-schema.test.ts` |
| `env.ts` / `google-auth.ts` | `env.test.ts`, `google-auth.test.ts` |
| `graph-layout.ts` | `graph-layout.test.ts` |
| `daily-review.ts` | `daily-review.test.ts` |
| `tags.ts` / `backlinks.ts` / `share.ts` | 各自 `*.test.ts` |
| `utils.ts` | `utils.test.ts` |
| `prisma.ts` | — 薄封装，依赖集成环境 |

## 组件覆盖

| 组件 | 测试文件 |
|------|----------|
| `note-editor.tsx` | `note-editor.test.tsx` |
| `notes-list.tsx` / `note-card.tsx` | `notes-list.test.tsx`, `note-card.test.tsx` |
| `backlinks-panel.tsx` | `backlinks-panel.test.tsx` |
| `wiki-link-autocomplete.tsx` | `wiki-link-autocomplete.test.tsx` |
| `wiki-link-hint.tsx` | `wiki-link-hint.test.tsx` |
| `note-io-panel.tsx` | `note-io-panel.test.tsx` |
| `note-share-button.tsx` | `note-share-button.test.tsx` |
| `markdown-viewer.tsx` | `markdown-viewer.test.tsx` |
| `template-picker.tsx` | `template-picker.test.tsx` |
| `file-uploader.tsx` | `file-uploader.test.tsx` |
| `search-bar.tsx` | `search-bar.test.tsx` |
| `knowledge-graph.tsx` | `knowledge-graph.test.tsx` |
| `graph-note-node.tsx` | `graph-note-node.test.tsx` |
| `setup-guide.tsx` / `sidebar.tsx` | `setup-guide.test.tsx`, `sidebar.test.tsx` |
| `google-sign-in-button.tsx` | `google-sign-in-button.test.tsx` |
| `oauth-divider.tsx` | `oauth-divider.test.tsx` |
| `components/ui/*` | — shadcn 基础组件，不测 |

## 基础设施 & 扩展

| 模块 | 测试文件 |
|------|----------|
| `middleware.ts` | `middleware.test.ts` |
| `stores/note-store.ts` | `note-store.test.ts` |
| `extension/page-data.js` | `extension/page-data.test.ts` |
| `extension/config.js` | `extension/config.test.ts` |

## 未覆盖（有意跳过）

以下模块**不适合**或未纳入 Vitest 单测，建议用 Playwright/Cypress E2E 补充：

- **Dashboard 页面**：`src/app/dashboard/**/page.tsx`
- **认证页面**：`login/page.tsx`、`register/page.tsx`
- **公开分享页**：`share/[id]/page.tsx`（RSC + Prisma）
- **SessionProvider**：NextAuth 薄包装
- **popup.js 完整流程**：需 Chrome API mock，已测提取的 `config.js` 逻辑

## 验收记录

```
Test Files  74 passed (74)
     Tests  386 passed (386)
```

由 4 个并行 subagent 完成主要补强，主 agent 补充 `note-editor` 测试与本文档。