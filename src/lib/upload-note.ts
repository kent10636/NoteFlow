export function buildNoteTitleFromFileName(fileName: string): string {
  const trimmed = fileName.trim();
  if (!trimmed) return "未命名附件";

  const lastDot = trimmed.lastIndexOf(".");
  if (lastDot <= 0) return trimmed;

  const baseName = trimmed.slice(0, lastDot).trim();
  return baseName || trimmed;
}

export function buildNoteContentFromUpload(options: {
  fileName: string;
  ocrText?: string | null;
  url?: string;
}): string {
  const { fileName, ocrText, url } = options;
  const sections = [`## 附件: ${fileName}`];

  if (url) {
    sections.push("", `来源: ${url}`);
  }

  const text = ocrText?.trim();
  if (text) {
    sections.push("", text);
  }

  return sections.join("\n");
}

export function buildNoteTagsFromUpload(mimeType: string): string[] {
  return ["上传", mimeType.startsWith("image/") ? "图片" : "PDF"];
}

export function shouldAutoCreateNote(options: {
  createNote: boolean;
  existingNoteId?: string | null;
}): boolean {
  return options.createNote && !options.existingNoteId;
}