import type { PrismaClient } from "@prisma/client";

const WIKI_LINK_PATTERN = /\[\[([^\]]+)\]\]/g;

export function extractWikiLinks(content: string): string[] {
  const titles: string[] = [];
  const seen = new Set<string>();

  for (const match of content.matchAll(WIKI_LINK_PATTERN)) {
    const title = match[1].trim();
    if (!title) continue;

    const key = title.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    titles.push(title);
  }

  return titles;
}

export function resolveWikiLinkTargets(
  linkTitles: string[],
  notes: { id: string; title: string }[],
  sourceNoteId: string
): string[] {
  const titleToId = new Map<string, string>();

  for (const note of notes) {
    const key = note.title.trim().toLowerCase();
    if (!key || titleToId.has(key)) continue;
    titleToId.set(key, note.id);
  }

  const targets: string[] = [];
  const seenTargets = new Set<string>();

  for (const title of linkTitles) {
    const targetId = titleToId.get(title.trim().toLowerCase());
    if (!targetId || targetId === sourceNoteId || seenTargets.has(targetId)) {
      continue;
    }

    seenTargets.add(targetId);
    targets.push(targetId);
  }

  return targets;
}

export async function syncNoteLinks(
  userId: string,
  noteId: string,
  content: string,
  prisma: PrismaClient
): Promise<void> {
  const linkTitles = extractWikiLinks(content);

  const userNotes = await prisma.note.findMany({
    where: { userId },
    select: { id: true, title: true },
  });

  const targetIds = resolveWikiLinkTargets(linkTitles, userNotes, noteId);

  await prisma.noteLink.deleteMany({
    where: {
      fromNoteId: noteId,
      ...(targetIds.length > 0
        ? { toNoteId: { notIn: targetIds } }
        : {}),
    },
  });

  await Promise.all(
    targetIds.map((toNoteId) =>
      prisma.noteLink.upsert({
        where: {
          fromNoteId_toNoteId: { fromNoteId: noteId, toNoteId },
        },
        create: { fromNoteId: noteId, toNoteId },
        update: {},
      })
    )
  );
}