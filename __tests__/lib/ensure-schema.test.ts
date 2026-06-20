import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $executeRawUnsafe: vi.fn().mockResolvedValue(0),
  },
}));

import { prisma } from "@/lib/prisma";

describe("ensureSchema", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("adds clipToken column and unique index", async () => {
    const { ensureSchema } = await import("@/lib/ensure-schema");
    await ensureSchema();

    const execute = vi.mocked(prisma.$executeRawUnsafe);
    expect(execute).toHaveBeenCalled();
    const sql = execute.mock.calls.map((c) => c[0]).join("\n");
    expect(sql).toContain("clipToken");
    expect(sql).toContain("User_clipToken_key");
  });

  it("runs only once when called concurrently", async () => {
    vi.resetModules();
    const { ensureSchema } = await import("@/lib/ensure-schema");
    const execute = vi.mocked(prisma.$executeRawUnsafe);
    execute.mockClear();

    await Promise.all([ensureSchema(), ensureSchema(), ensureSchema()]);

    expect(execute).toHaveBeenCalledTimes(2);
  });
});