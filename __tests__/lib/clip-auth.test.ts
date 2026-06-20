import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findFirst: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import {
  generateClipToken,
  hashClipToken,
  resolveUserFromClipToken,
} from "@/lib/clip-auth";

const mockFindFirst = vi.mocked(prisma.user.findFirst);

describe("clip-auth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("generateClipToken returns base64url string", () => {
    const token = generateClipToken();
    expect(token).toBeTruthy();
    expect(token.length).toBeGreaterThan(20);
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("hashClipToken is deterministic", () => {
    expect(hashClipToken("abc")).toBe(hashClipToken("abc"));
    expect(hashClipToken("abc")).not.toBe(hashClipToken("xyz"));
  });

  it("resolveUserFromClipToken rejects missing header", async () => {
    expect(await resolveUserFromClipToken(null)).toBeNull();
    expect(await resolveUserFromClipToken("Basic abc")).toBeNull();
  });

  it("resolveUserFromClipToken rejects empty bearer token", async () => {
    expect(await resolveUserFromClipToken("Bearer ")).toBeNull();
  });

  it("resolveUserFromClipToken returns user id for valid token", async () => {
    mockFindFirst.mockResolvedValue({ id: "user-42" } as never);

    const userId = await resolveUserFromClipToken("Bearer secret-token");

    expect(userId).toBe("user-42");
    expect(mockFindFirst).toHaveBeenCalledWith({
      where: { clipToken: "secret-token" },
      select: { id: true },
    });
  });

  it("resolveUserFromClipToken returns null when token not found", async () => {
    mockFindFirst.mockResolvedValue(null);
    expect(await resolveUserFromClipToken("Bearer unknown")).toBeNull();
  });
});