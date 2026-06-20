import { prisma } from "@/lib/prisma";
import { generateEmbedding } from "@/lib/ai";

/** Store embedding vector for a note using raw SQL (pgvector) */
export async function storeNoteEmbedding(
  noteId: string,
  text: string
): Promise<void> {
  const embedding = await generateEmbedding(text);
  const vectorString = `[${embedding.join(",")}]`;

  await prisma.$executeRawUnsafe(
    `UPDATE "Note" SET embedding = $1::vector WHERE id = $2`,
    vectorString,
    noteId
  );
}

/** Semantic search using cosine similarity */
export async function semanticSearch(
  userId: string,
  query: string,
  limit = 10
): Promise<
  { id: string; title: string; content: string; summary: string | null; tags: string[]; similarity: number }[]
> {
  const queryEmbedding = await generateEmbedding(query);
  const vectorString = `[${queryEmbedding.join(",")}]`;

  try {
    const results = await prisma.$queryRawUnsafe<
      {
        id: string;
        title: string;
        content: string;
        summary: string | null;
        tags: string[];
        similarity: number;
      }[]
    >(
      `SELECT id, title, content, summary, tags,
              1 - (embedding <=> $1::vector) AS similarity
       FROM "Note"
       WHERE "userId" = $2 AND embedding IS NOT NULL
       ORDER BY embedding <=> $1::vector
       LIMIT $3`,
      vectorString,
      userId,
      limit
    );

    return results;
  } catch (error) {
    console.error("Semantic search failed, falling back to text search:", error);
    return textSearch(userId, query, limit);
  }
}

/** Fallback text-based search */
async function textSearch(
  userId: string,
  query: string,
  limit: number
) {
  const notes = await prisma.note.findMany({
    where: {
      userId,
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { content: { contains: query, mode: "insensitive" } },
        { tags: { hasSome: [query] } },
      ],
    },
    take: limit,
    select: {
      id: true,
      title: true,
      content: true,
      summary: true,
      tags: true,
    },
  });

  return notes.map((note) => ({ ...note, similarity: 0.5 }));
}