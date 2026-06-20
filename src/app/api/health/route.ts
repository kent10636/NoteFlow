import { NextResponse } from "next/server";
import { checkEnv, isDatabaseConfigured } from "@/lib/env";
import { ensureSchema } from "@/lib/ensure-schema";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const env = checkEnv();
  let database = false;

  if (isDatabaseConfigured()) {
    try {
      await ensureSchema();
      await prisma.$queryRaw`SELECT 1`;
      database = true;
    } catch {
      database = false;
    }
  }

  const status = env.valid && database ? "healthy" : "degraded";

  return NextResponse.json(
    {
      status,
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      checks: {
        env: env.valid,
        database,
      },
      env: {
        missing: env.missing,
        warnings: env.warnings,
        optional: env.optional,
      },
    },
    { status: status === "healthy" ? 200 : 503 }
  );
}