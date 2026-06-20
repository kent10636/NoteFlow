import { config } from "dotenv";

if (!process.env.DATABASE_URL) {
  config({ path: ".env.vercel", override: true });
  config();
}

async function main() {
  const { prisma } = await import("../src/lib/prisma");
  const { storeNoteEmbedding } = await import("../src/lib/embeddings");

  console.log("=== Backfilling note embeddings ===\n");

  const notes = await prisma.$queryRaw<
    { id: string; title: string; content: string }[]
  >`SELECT id, title, content FROM "Note" WHERE embedding IS NULL`;

  console.log(`Found ${notes.length} notes without embeddings\n`);

  let success = 0;
  let failed = 0;

  for (const note of notes) {
    try {
      await storeNoteEmbedding(note.id, `${note.title}\n${note.content}`);
      success++;
      console.log(`✅ ${note.title.slice(0, 40)}`);
    } catch (error) {
      failed++;
      console.log(`❌ ${note.title.slice(0, 40)}: ${error}`);
    }
  }

  console.log(`\n=== Done: ${success} success, ${failed} failed ===`);
  await prisma.$disconnect();
}

main();