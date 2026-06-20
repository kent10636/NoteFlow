import { config } from "dotenv";

// Only load from file if not already injected (e.g. via `vercel env run`)
if (!process.env.DATABASE_URL) {
  config({ path: ".env.vercel", override: true });
  config();
}

async function main() {
  const { prisma } = await import("../src/lib/prisma");

  console.log("=== Enabling pgvector extension ===\n");

  try {
    const extensions = await prisma.$queryRaw<
      { extname: string; extversion: string }[]
    >`SELECT extname, extversion FROM pg_extension WHERE extname = 'vector'`;

    if (extensions.length > 0) {
      console.log(`✅ pgvector already enabled (v${extensions[0].extversion})`);
    } else {
      await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS vector`);
      console.log("✅ pgvector extension created successfully");
    }

    const types = await prisma.$queryRaw<{ typname: string }[]>`
      SELECT typname FROM pg_type WHERE typname = 'vector'
    `;
    if (types.length > 0) {
      console.log("✅ vector type available");
    } else {
      console.log("❌ vector type not found");
      process.exit(1);
    }

    const columns = await prisma.$queryRaw<
      { column_name: string; udt_name: string }[]
    >`
      SELECT column_name, udt_name
      FROM information_schema.columns
      WHERE table_name = 'Note' AND column_name = 'embedding'
    `;

    if (columns.length > 0) {
      console.log(`✅ Note.embedding column exists (type: ${columns[0].udt_name})`);
    } else {
      console.log("⚠️  Note.embedding column not found — run prisma db push");
    }

    const count = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) as count FROM "Note" WHERE embedding IS NOT NULL
    `;
    console.log(`ℹ️  Notes with embeddings: ${count[0].count}`);

    console.log("\n=== Done ===");
  } catch (error) {
    console.error("❌ Failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();