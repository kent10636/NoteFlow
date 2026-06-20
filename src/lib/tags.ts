export interface TagStat {
  name: string;
  count: number;
}

export function aggregateTags(
  notes: { tags: string[] }[]
): TagStat[] {
  const counts = new Map<string, number>();

  for (const note of notes) {
    for (const tag of note.tags) {
      const trimmed = tag.trim();
      if (!trimmed) continue;
      counts.set(trimmed, (counts.get(trimmed) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "zh-CN"));
}

export function renameTagInNotes(
  notes: { id: string; tags: string[] }[],
  fromTag: string,
  toTag: string
): { id: string; tags: string[] }[] {
  const normalizedFrom = fromTag.trim();
  const normalizedTo = toTag.trim();
  if (!normalizedFrom || !normalizedTo) return [];

  return notes
    .filter((note) => note.tags.includes(normalizedFrom))
    .map((note) => ({
      id: note.id,
      tags: [
        ...new Set(
          note.tags.map((tag) =>
            tag === normalizedFrom ? normalizedTo : tag
          )
        ),
      ],
    }));
}

export function mergeTagsInNotes(
  notes: { id: string; tags: string[] }[],
  sourceTags: string[],
  targetTag: string
): { id: string; tags: string[] }[] {
  const sources = new Set(sourceTags.map((t) => t.trim()).filter(Boolean));
  const target = targetTag.trim();
  if (sources.size === 0 || !target) return [];

  return notes
    .filter((note) => note.tags.some((tag) => sources.has(tag)))
    .map((note) => ({
      id: note.id,
      tags: [
        ...new Set(
          note.tags.map((tag) => (sources.has(tag) ? target : tag))
        ),
      ],
    }));
}