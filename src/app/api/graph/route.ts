import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const notes = await prisma.note.findMany({
    where: { userId: session.user.id },
    select: { id: true, title: true, tags: true },
  });

  const links = await prisma.noteLink.findMany({
    where: {
      fromNote: { userId: session.user.id },
    },
    select: {
      id: true,
      fromNoteId: true,
      toNoteId: true,
      strength: true,
    },
  });

  const nodes = notes.map((note) => ({
    id: note.id,
    label: note.title,
    tags: note.tags,
  }));

  const edges = links.map((link) => ({
    id: link.id,
    source: link.fromNoteId,
    target: link.toNoteId,
    strength: link.strength,
  }));

  // Generate tag-based implicit links
  const existingPairs = new Set(
    edges.map((e) => `${e.source}-${e.target}`)
  );

  for (let i = 0; i < notes.length; i++) {
    for (let j = i + 1; j < notes.length; j++) {
      const a = notes[i];
      const b = notes[j];
      const sharedTags = a.tags.filter((t) => b.tags.includes(t));
      if (sharedTags.length > 0) {
        const pairKey = `${a.id}-${b.id}`;
        const reverseKey = `${b.id}-${a.id}`;
        if (!existingPairs.has(pairKey) && !existingPairs.has(reverseKey)) {
          edges.push({
            id: `tag-${a.id}-${b.id}`,
            source: a.id,
            target: b.id,
            strength: Math.min(0.5, sharedTags.length * 0.15),
          });
          existingPairs.add(pairKey);
        }
      }
    }
  }

  return NextResponse.json({ nodes, edges });
}