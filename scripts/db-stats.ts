import { config } from "dotenv";
if (!process.env.DATABASE_URL) {
  config({ path: ".env.vercel", override: true });
  config();
}

async function main() {
  const { prisma } = await import("../src/lib/prisma");

  const [notes, users, withEmb, pgvector] = await Promise.all([
    prisma.note.count(),
    prisma.user.count(),
    prisma.$queryRaw<{ c: number }[]>`SELECT COUNT(*)::int as c FROM "Note" WHERE embedding IS NOT NULL`,
    prisma.$queryRaw<{ extversion: string }[]>`SELECT extversion FROM pg_extension WHERE extname = 'vector'`,
  ]);

  console.log(JSON.stringify({
    users,
    notes,
    embeddings: withEmb[0].c,
    pgvector: pgvector[0]?.extversion ?? "not installed",
  }));

  await prisma.$disconnect();
}

main();