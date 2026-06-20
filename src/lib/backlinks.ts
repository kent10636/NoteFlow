export interface BacklinkItem {
  id: string;
  title: string;
  updatedAt: string;
}

export function formatBacklinks(
  notes: { id: string; title: string; updatedAt: Date }[]
): BacklinkItem[] {
  return notes.map((note) => ({
    id: note.id,
    title: note.title,
    updatedAt: note.updatedAt.toISOString(),
  }));
}