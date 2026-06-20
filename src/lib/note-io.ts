export const NOTE_IO_VERSION = 1;
export const MAX_IMPORT_NOTES = 500;
export const MAX_IMPORT_BYTES = 5 * 1024 * 1024;

export interface NoteExportRecord {
  title: string;
  content: string;
  summary?: string | null;
  tags?: string[];
  published?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface NoteJsonExport {
  version: number;
  exportedAt: string;
  notes: NoteExportRecord[];
}

export interface ParsedImportNote {
  title: string;
  content: string;
  summary?: string | null;
  tags: string[];
  published: boolean;
}

function escapeYaml(value: string): string {
  if (/[:#\n\r"'[\]{}>|*&!%@`]/.test(value) || value.startsWith(" ")) {
    return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
  }
  return value;
}

function parseYamlTags(raw: string): string[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed.replace(/'/g, '"')) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item).trim()).filter(Boolean);
      }
    } catch {
      // fall through to comma split
    }
  }
  return trimmed
    .split(",")
    .map((tag) => tag.trim().replace(/^['"]|['"]$/g, ""))
    .filter(Boolean);
}

function parseFrontmatter(block: string): {
  meta: Record<string, string>;
  content: string;
} {
  const lines = block.split("\n");
  const meta: Record<string, string> = {};
  let index = 0;

  for (; index < lines.length; index++) {
    const line = lines[index];
    if (!line.trim()) continue;
    const colon = line.indexOf(":");
    if (colon === -1) break;
    const key = line.slice(0, colon).trim();
    const value = line.slice(colon + 1).trim();
    meta[key] = value;
  }

  const content = lines.slice(index + 1).join("\n").trim();
  return { meta, content };
}

export function serializeNotesToJson(notes: NoteExportRecord[]): NoteJsonExport {
  return {
    version: NOTE_IO_VERSION,
    exportedAt: new Date().toISOString(),
    notes,
  };
}

export function parseNotesFromJson(input: unknown): ParsedImportNote[] {
  if (!input || typeof input !== "object") {
    throw new Error("无效的 JSON 格式");
  }

  const payload = input as Partial<NoteJsonExport> & { notes?: unknown };
  if (!Array.isArray(payload.notes)) {
    throw new Error("JSON 中缺少 notes 数组");
  }

  if (payload.notes.length > MAX_IMPORT_NOTES) {
    throw new Error(`单次最多导入 ${MAX_IMPORT_NOTES} 条笔记`);
  }

  return payload.notes.map((item, index) => {
    if (!item || typeof item !== "object") {
      throw new Error(`第 ${index + 1} 条笔记格式无效`);
    }
    const note = item as NoteExportRecord;
    const title = note.title?.trim();
    if (!title) {
      throw new Error(`第 ${index + 1} 条笔记缺少标题`);
    }
    return {
      title,
      content: note.content ?? "",
      summary: note.summary ?? null,
      tags: Array.isArray(note.tags)
        ? note.tags.map((tag) => String(tag).trim()).filter(Boolean)
        : [],
      published: Boolean(note.published),
    };
  });
}

export function serializeNotesToMarkdown(notes: NoteExportRecord[]): string {
  return notes
    .map((note) => {
      const tags = note.tags?.length
        ? `[${note.tags.map((tag) => JSON.stringify(tag)).join(", ")}]`
        : "[]";
      const frontmatter = [
        "---",
        `title: ${escapeYaml(note.title)}`,
        `tags: ${tags}`,
        note.summary ? `summary: ${escapeYaml(note.summary)}` : null,
        note.published ? "published: true" : null,
        note.createdAt ? `createdAt: ${note.createdAt}` : null,
        note.updatedAt ? `updatedAt: ${note.updatedAt}` : null,
        "---",
      ]
        .filter(Boolean)
        .join("\n");

      return `${frontmatter}\n\n${note.content ?? ""}`.trim();
    })
    .join("\n\n---\n\n");
}

function parseMarkdownBlock(block: string, index: number): ParsedImportNote {
  if (!block.startsWith("---")) {
    const title =
      block
        .split("\n")[0]
        ?.replace(/^#+\s*/, "")
        .trim() || `导入笔记 ${index + 1}`;
    return {
      title,
      content: block,
      summary: null,
      tags: [],
      published: false,
    };
  }

  const withoutOpening = block.replace(/^---\n?/, "");
  const closing = withoutOpening.indexOf("\n---");
  if (closing === -1) {
    throw new Error(`第 ${index + 1} 条 Markdown 笔记缺少 frontmatter 结束标记`);
  }

  const frontmatter = withoutOpening.slice(0, closing);
  const body = withoutOpening.slice(closing + 4).trim();
  const { meta } = parseFrontmatter(frontmatter);
  const title = meta.title?.trim();

  if (!title) {
    throw new Error(`第 ${index + 1} 条 Markdown 笔记缺少 title`);
  }

  return {
    title,
    content: body,
    summary: meta.summary ?? null,
    tags: meta.tags ? parseYamlTags(meta.tags) : [],
    published: meta.published === "true",
  };
}

export function parseNotesFromMarkdown(content: string): ParsedImportNote[] {
  const normalized = content.replace(/\r\n/g, "\n").trim();
  if (!normalized) {
    throw new Error("Markdown 内容为空");
  }

  const blocks = normalized
    .split(/\n\n---\n\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  if (blocks.length > MAX_IMPORT_NOTES) {
    throw new Error(`单次最多导入 ${MAX_IMPORT_NOTES} 条笔记`);
  }

  return blocks.map((block, index) => parseMarkdownBlock(block, index));
}

export function sanitizeImportPayloadSize(bytes: number): void {
  if (bytes > MAX_IMPORT_BYTES) {
    throw new Error("导入文件不能超过 5MB");
  }
}