export interface ClipPayload {
  title?: string;
  url?: string;
  content?: string;
  selection?: string;
}

export function buildClippedNote(payload: ClipPayload): {
  title: string;
  content: string;
  tags: string[];
} {
  const pageTitle = payload.title?.trim() || "网页剪藏";
  const url = payload.url?.trim();
  const selection = payload.selection?.trim();
  const extra = payload.content?.trim();

  const parts = [`# ${pageTitle}`, ""];

  if (url) {
    parts.push(`> 来源：${url}`, "");
  }

  if (selection) {
    parts.push("## 选中内容", "", selection, "");
  }

  if (extra && extra !== selection) {
    parts.push("## 页面摘要", "", extra, "");
  }

  if (!selection && !extra) {
    parts.push("_（未捕获选中内容，仅保存页面标题与链接）_", "");
  }

  return {
    title: pageTitle,
    content: parts.join("\n").trim(),
    tags: ["剪藏"],
  };
}