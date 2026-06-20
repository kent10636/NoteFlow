export interface NoteTitleOption {
  id: string;
  title: string;
}

export interface WikiLinkTrigger {
  query: string;
  replaceStart: number;
  replaceEnd: number;
}

export function detectWikiLinkTrigger(
  content: string,
  cursor: number
): WikiLinkTrigger | null {
  if (cursor < 0 || cursor > content.length) return null;

  const before = content.slice(0, cursor);
  const match = before.match(/\[\[([^\]]*)$/);
  if (!match) return null;

  return {
    query: match[1],
    replaceStart: cursor - match[0].length,
    replaceEnd: cursor,
  };
}

export function filterNoteTitles(
  titles: NoteTitleOption[],
  query: string,
  excludeId?: string
): NoteTitleOption[] {
  const normalized = query.trim().toLowerCase();

  return titles
    .filter((note) => note.id !== excludeId)
    .filter((note) =>
      normalized ? note.title.toLowerCase().includes(normalized) : true
    )
    .slice(0, 8);
}

export function insertWikiLink(
  content: string,
  trigger: WikiLinkTrigger,
  title: string
): { nextContent: string; nextCursor: number } {
  const insertion = `[[${title}]]`;
  const nextContent =
    content.slice(0, trigger.replaceStart) +
    insertion +
    content.slice(trigger.replaceEnd);
  const nextCursor = trigger.replaceStart + insertion.length;

  return { nextContent, nextCursor };
}

export function clampSelectedIndex(index: number, count: number): number {
  if (count <= 0) return 0;
  return Math.max(0, Math.min(index, count - 1));
}