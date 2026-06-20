import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn(),
  getClientIp: vi.fn(() => "127.0.0.1"),
  rateLimitKey: vi.fn(() => "register:127.0.0.1"),
  RATE_LIMITS: { register: { limit: 5, windowMs: 900000 } },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn(async (pw: string) => `hashed:${pw}`),
  },
}));

import { checkRateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { POST } from "@/app/api/register/route";

const mockRateLimit = vi.mocked(checkRateLimit);
const mockFindUnique = vi.mocked(prisma.user.findUnique);
const mockCreate = vi.mocked(prisma.user.create);

function registerRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("register API route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockResolvedValue({
      allowed: true,
      remaining: 4,
      retryAfter: 0,
    });
  });

  it("returns 429 when rate limited", async () => {
    mockRateLimit.mockResolvedValue({
      allowed: false,
      remaining: 0,
      retryAfter: 900,
    });

    const res = await POST(registerRequest({ email: "a@b.com", password: "123456" }));
    expect(res.status).toBe(429);
    const data = await res.json();
    expect(data.error).toContain("注册过于频繁");
  });

  it("returns 400 when email or password missing", async () => {
    const res = await POST(registerRequest({ email: "a@b.com" }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("邮箱和密码为必填项");
  });

  it("returns 400 when password too short", async () => {
    const res = await POST(
      registerRequest({ email: "a@b.com", password: "12345" })
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain("6 个字符");
  });

  it("returns 409 when email already exists", async () => {
    mockFindUnique.mockResolvedValue({ id: "existing" } as never);

    const res = await POST(
      registerRequest({ email: "taken@b.com", password: "123456" })
    );
    expect(res.status).toBe(409);
    expect((await res.json()).error).toBe("该邮箱已被注册");
  });

  it("creates user and returns 201", async () => {
    mockFindUnique.mockResolvedValue(null);
    mockCreate.mockResolvedValue({
      id: "u-new",
      name: "Alice",
      email: "alice@b.com",
    } as never);

    const res = await POST(
      registerRequest({
        name: "Alice",
        email: "alice@b.com",
        password: "secure1",
      })
    );
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.user).toEqual({
      id: "u-new",
      name: "Alice",
      email: "alice@b.com",
    });
    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        name: "Alice",
        email: "alice@b.com",
        password: "hashed:secure1",
      },
      select: { id: true, name: true, email: true },
    });
  });

  it("defaults name from email local part", async () => {
    mockFindUnique.mockResolvedValue(null);
    mockCreate.mockResolvedValue({
      id: "u1",
      name: "bob",
      email: "bob@corp.com",
    } as never);

    await POST(registerRequest({ email: "bob@corp.com", password: "123456" }));

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ name: "bob" }),
      })
    );
  });
});