# 测试覆盖说明

> 返回 [README](../README.md)

运行 `npm test` 查看当前测试数量。以下为覆盖地图，不随每次提交自动更新数字。

## 快速运行

```bash
npm test                      # 全量
npm run test:api              # API 路由
npm run test:lib              # 工具库
npm run test:components       # React 组件
npm run test:integration      # 功能矩阵
npm run test:extension        # 浏览器扩展
npm run test:stores           # Zustand store
```

功能验收清单：`__tests__/integration/feature-matrix.test.ts`（14 个功能域）。

## 覆盖概览

| 层级 | 状态 | 说明 |
|------|------|------|
| API 路由 | ✅ | 20/21，仅 NextAuth handlers 薄封装未单测 |
| 工具库 `src/lib/` | ✅ | 核心业务逻辑全覆盖 |
| 业务组件 | ✅ | 18 个含逻辑的组件均有测试 |
| 基础设施 | ✅ | middleware、note-store、utils |
| 浏览器扩展 | ✅ | `page-data.js`、`config.js` |
| 页面 RSC | ⏭ | 建议 E2E，单测 ROI 低 |

## API 路由清单

| 路由 | 测试文件 |
|------|----------|
| `POST /api/register` | `register-route.test.ts` |
| `GET /api/health` | `health-route.test.ts` |
| `GET/POST /api/notes` | `notes-route.test.ts` |
| `GET/PUT/DELETE /api/notes/[id]` | `notes-id-route.test.ts` |
| `GET /api/notes/titles` | `notes-titles-route.test.ts` |
| `POST /api/notes/import` | `notes-import-route.test.ts` |
| `GET /api/notes/export` | `notes-export-route.test.ts` |
| `POST /api/notes/batch` | `batch.test.ts` |
| `GET /api/notes/[id]/backlinks` | `backlinks.test.ts` |
| `POST /api/search` | `search-route.test.ts` |
| `GET /api/graph` | `graph-route.test.ts` |
| `POST /api/upload` | `upload-route.test.ts` |
| `GET/POST /api/tags` | `tags.test.ts` |
| `POST /api/clip` | `clip.test.ts` |
| `GET/POST /api/clip-token` | `clip-token.test.ts` |
| `GET /api/setup/status` | `setup-status-route.test.ts` |
| `POST /api/ai/summarize` | `ai-summarize-route.test.ts` |
| `POST /api/ai/tags` | `ai-tags-route.test.ts` |
| `POST /api/ai/recommend` | `ai-recommend-route.test.ts` |
| `GET/POST /api/ai/daily-review` | `ai-daily-review-route.test.ts` |
| `/api/auth/[...nextauth]` | — |

## 组件测试

`note-editor` · `notes-list` · `note-card` · `backlinks-panel` · `wiki-link-autocomplete` · `wiki-link-hint` · `note-io-panel` · `note-share-button` · `markdown-viewer` · `template-picker` · `file-uploader` · `search-bar` · `knowledge-graph` · `graph-note-node` · `setup-guide` · `sidebar` · `google-sign-in-button` · `oauth-divider`

（`components/ui/*` 等 shadcn 基础组件不测）

## 有意跳过

- Dashboard / 登录 / 注册 / 分享页面（RSC）
- `SessionProvider`、NextAuth 官方 handlers
- 扩展 `popup.js` 完整 Chrome API 流程（已测提取的纯函数模块）