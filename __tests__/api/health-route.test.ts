import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/env", () => ({
  checkEnv: vi.fn(),
  isDatabaseConfigured: vi.fn(),
}));

vi.mock("@/lib/ensure-schema", () => ({
  ensureSchema: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $queryRaw: vi.fn(),
  },
}));

import { checkEnv, isDatabaseConfigured } from "@/lib/env";
import { ensureSchema } from "@/lib/ensure-schema";
import { prisma } from "@/lib/prisma";
import { GET } from "@/app/api/health/route";

const mockCheckEnv = vi.mocked(checkEnv);
const mockDbConfigured = vi.mocked(isDatabaseConfigured);
const mockEnsureSchema = vi.mocked(ensureSchema);
const mockQueryRaw = vi.mocked(prisma.$queryRaw);

describe("health API route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckEnv.mockReturnValue({
      valid: true,
      missing: [],
      warnings: [],
      optional: [],
    });
    mockDbConfigured.mockReturnValue(true);
    mockEnsureSchema.mockResolvedValue(undefined);
    mockQueryRaw.mockResolvedValue([{ "?column?": 1 }] as never);
  });

  it("returns healthy when env and database pass", async () => {
    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.status).toBe("healthy");
    expect(data.checks).toEqual({ env: true, database: true });
    expect(mockEnsureSchema).toHaveBeenCalled();
  });

  it("returns degraded with 503 when env is invalid", async () => {
    mockCheckEnv.mockReturnValue({
      valid: false,
      missing: ["DATABASE_URL"],
      warnings: [],
      optional: [],
    });

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(503);
    expect(data.status).toBe("degraded");
    expect(data.env.missing).toContain("DATABASE_URL");
  });

  it("returns degraded when database query fails", async () => {
    mockQueryRaw.mockRejectedValue(new Error("connection refused"));

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(503);
    expect(data.checks.database).toBe(false);
  });

  it("skips database check when not configured", async () => {
    mockDbConfigured.mockReturnValue(false);

    const res = await GET();
    const data = await res.json();

    expect(data.checks.database).toBe(false);
    expect(mockEnsureSchema).not.toHaveBeenCalled();
  });
});