import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  try {
    await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS vector`);
    console.log("pgvector extension enabled");
  } catch (error) {
    console.warn("Could not enable pgvector:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();