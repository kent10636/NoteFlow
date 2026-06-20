import { prisma } from "@/lib/prisma";

let schemaEnsured = false;
let schemaPromise: Promise<void> | null = null;

/** Idempotent production schema patches for columns added after initial deploy. */
export async function ensureSchema(): Promise<void> {
  if (schemaEnsured) return;
  if (schemaPromise) return schemaPromise;

  schemaPromise = (async () => {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "clipToken" TEXT;
    `);
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "User_clipToken_key" ON "User"("clipToken");
    `);
    schemaEnsured = true;
  })().catch((error) => {
    schemaPromise = null;
    console.error("ensureSchema failed:", error);
    throw error;
  });

  return schemaPromise;
}