import { describe, it, expect } from "vitest";
import { existsSync } from "fs";
import { join } from "path";

/**
 * Feature coverage matrix — each feature maps to lib tests, API tests, and source files.
 * Subagents use this as the acceptance checklist.
 */
const FEATURES = [
  {
    name: "认证 / Google OAuth",
    libTests: [
      "__tests__/lib/google-auth.test.ts",
      "__tests__/lib/env.test.ts",
      "__tests__/lib/auth-config.test.ts",
      "__tests__/lib/auth-credentials.test.ts",
      "__tests__/lib/rate-limit-response.test.ts",
      "__tests__/middleware.test.ts",
    ],
    apiTests: [
      "__tests__/api/register.test.ts",
      "__tests__/api/register-route.test.ts",
      "__tests__/api/clip-token.test.ts",
    ],
    componentTests: [
      "__tests__/components/google-sign-in-button.test.tsx",
      "__tests__/components/oauth-divider.test.tsx",
    ],
    sources: ["src/lib/auth.ts", "src/lib/google-auth.ts", "src/middleware.ts"],
  },
  {
    name: "笔记 CRUD / 导入导出",
    libTests: [
      "__tests__/lib/note-io.test.ts",
      "__tests__/lib/share.test.ts",
      "__tests__/stores/note-store.test.ts",
    ],
    apiTests: [
      "__tests__/api/notes-route.test.ts",
      "__tests__/api/notes-id-route.test.ts",
      "__tests__/api/notes-titles-route.test.ts",
      "__tests__/api/notes-import-route.test.ts",
      "__tests__/api/notes-export-route.test.ts",
    ],
    componentTests: [
      "__tests__/components/note-io-panel.test.tsx",
      "__tests__/components/note-share-button.test.tsx",
      "__tests__/components/markdown-viewer.test.tsx",
      "__tests__/components/note-editor.test.tsx",
    ],
    sources: [
      "src/app/api/notes/route.ts",
      "src/app/api/notes/import/route.ts",
      "src/app/api/notes/export/route.ts",
      "src/stores/note-store.ts",
      "src/components/notes/note-editor.tsx",
    ],
  },
  {
    name: "双向链接 / 自动补全",
    libTests: [
      "__tests__/lib/wikilink.test.ts",
      "__tests__/lib/wikilink-sync.test.ts",
      "__tests__/lib/wikilink-autocomplete.test.ts",
    ],
    apiTests: ["__tests__/api/backlinks.test.ts"],
    componentTests: [
      "__tests__/components/wiki-link-autocomplete.test.tsx",
      "__tests__/components/wiki-link-hint.test.tsx",
    ],
    sources: ["src/lib/wikilink.ts", "src/components/notes/wiki-link-autocomplete.tsx"],
  },
  {
    name: "反向链接面板",
    libTests: ["__tests__/lib/backlinks.test.ts"],
    apiTests: ["__tests__/api/backlinks.test.ts"],
    componentTests: ["__tests__/components/backlinks-panel.test.tsx"],
    sources: ["src/components/notes/backlinks-panel.tsx"],
  },
  {
    name: "笔记模板",
    libTests: ["__tests__/lib/note-templates.test.ts"],
    apiTests: [],
    componentTests: ["__tests__/components/template-picker.test.tsx"],
    sources: ["src/lib/note-templates.ts", "src/components/notes/template-picker.tsx"],
  },
  {
    name: "标签管理",
    libTests: ["__tests__/lib/tags.test.ts"],
    apiTests: ["__tests__/api/tags.test.ts"],
    sources: ["src/app/dashboard/tags/page.tsx", "src/app/api/tags/route.ts"],
  },
  {
    name: "批量操作",
    libTests: [],
    apiTests: ["__tests__/api/batch.test.ts"],
    componentTests: [
      "__tests__/components/notes-list.test.tsx",
      "__tests__/components/note-card.test.tsx",
    ],
    sources: ["src/components/notes/notes-list.tsx", "src/app/api/notes/batch/route.ts"],
  },
  {
    name: "浏览器剪藏",
    libTests: [
      "__tests__/lib/clip-note.test.ts",
      "__tests__/lib/clip-auth.test.ts",
      "__tests__/extension/page-data.test.ts",
      "__tests__/extension/config.test.ts",
    ],
    apiTests: ["__tests__/api/clip.test.ts", "__tests__/api/clip-token.test.ts"],
    sources: [
      "extension/manifest.json",
      "extension/page-data.js",
      "extension/config.js",
      "src/app/api/clip/route.ts",
    ],
  },
  {
    name: "混合搜索 / 嵌入",
    libTests: [
      "__tests__/lib/hybrid-search.test.ts",
      "__tests__/lib/embeddings.test.ts",
    ],
    apiTests: ["__tests__/api/search-route.test.ts"],
    componentTests: ["__tests__/components/search-bar.test.tsx"],
    sources: ["src/lib/hybrid-search.ts", "src/app/api/search/route.ts"],
  },
  {
    name: "知识图谱",
    libTests: ["__tests__/lib/graph-layout.test.ts"],
    apiTests: ["__tests__/api/graph.test.ts", "__tests__/api/graph-route.test.ts"],
    componentTests: [
      "__tests__/components/knowledge-graph.test.tsx",
      "__tests__/components/graph-note-node.test.tsx",
    ],
    sources: ["src/components/graph/knowledge-graph.tsx"],
  },
  {
    name: "AI 功能",
    libTests: [
      "__tests__/lib/ai.test.ts",
      "__tests__/lib/ai-extended.test.ts",
      "__tests__/lib/daily-review.test.ts",
    ],
    apiTests: [
      "__tests__/api/ai-summarize-route.test.ts",
      "__tests__/api/ai-tags-route.test.ts",
      "__tests__/api/ai-recommend-route.test.ts",
      "__tests__/api/ai-daily-review-route.test.ts",
    ],
    sources: ["src/lib/ai.ts", "src/lib/daily-review.ts"],
  },
  {
    name: "文件上传 / OCR",
    libTests: [
      "__tests__/lib/upload-note.test.ts",
      "__tests__/lib/storage.test.ts",
      "__tests__/lib/ocr.test.ts",
    ],
    apiTests: ["__tests__/api/upload-route.test.ts"],
    componentTests: ["__tests__/components/file-uploader.test.tsx"],
    sources: ["src/app/api/upload/route.ts", "src/lib/upload-note.ts"],
  },
  {
    name: "Schema 自愈",
    libTests: ["__tests__/lib/ensure-schema.test.ts"],
    apiTests: ["__tests__/api/health-route.test.ts"],
    sources: ["src/lib/ensure-schema.ts", "src/app/api/health/route.ts"],
  },
  {
    name: "新手引导 / 设置",
    libTests: [],
    apiTests: ["__tests__/api/setup-status-route.test.ts"],
    componentTests: [
      "__tests__/components/setup-guide.test.tsx",
      "__tests__/components/sidebar.test.tsx",
    ],
    sources: [
      "src/app/api/setup/status/route.ts",
      "src/components/onboarding/setup-guide.tsx",
      "src/components/layout/sidebar.tsx",
    ],
  },
] as const;

type FeatureEntry = (typeof FEATURES)[number] & {
  componentTests?: readonly string[];
};

const ROOT = join(__dirname, "..", "..");

describe("Feature coverage matrix", () => {
  for (const feature of FEATURES) {
    it(`${feature.name} — source files exist`, () => {
      for (const file of feature.sources) {
        expect(existsSync(join(ROOT, file)), `${file} missing`).toBe(true);
      }
    });

    it(`${feature.name} — test files exist`, () => {
      const entry = feature as FeatureEntry;
      const tests = [
        ...feature.libTests,
        ...feature.apiTests,
        ...(entry.componentTests ?? []),
      ];
      expect(tests.length).toBeGreaterThan(0);
      for (const file of tests) {
        expect(existsSync(join(ROOT, file)), `${file} missing`).toBe(true);
      }
    });
  }

  it("covers all 14 feature areas", () => {
    expect(FEATURES.length).toBe(14);
  });
});