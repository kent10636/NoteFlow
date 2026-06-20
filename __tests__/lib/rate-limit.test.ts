import { afterEach, describe, expect, it, vi } from "vitest";
import {
  checkRateLimit,
  getClientIp,
  rateLimitKey,
  RATE_LIMITS,
} from "@/lib/rate-limit";

vi.mock("@vercel/functions", () => ({
  getCache: () => {
    throw new Error("cache unavailable in tests");
  },
}));

describe("getClientIp", () => {
  it("reads the first IP from x-forwarded-for", () => {
    const request = new Request("https://example.com", {
      headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
    });
    expect(getClientIp(request)).toBe("1.2.3.4");
  });

  it("falls back to x-real-ip", () => {
    const request = new Request("https://example.com", {
      headers: { "x-real-ip": "9.9.9.9" },
    });
    expect(getClientIp(request)).toBe("9.9.9.9");
  });
});

describe("checkRateLimit", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("allows requests under the limit using local fallback", async () => {
    const key = `test-${Date.now()}`;
    const config = { limit: 2, windowSeconds: 60 };

    const first = await checkRateLimit(key, config);
    const second = await checkRateLimit(key, config);

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(true);
    expect(second.remaining).toBe(0);
  });

  it("blocks requests above the limit", async () => {
    const key = `block-${Date.now()}`;
    const config = { limit: 1, windowSeconds: 60 };

    await checkRateLimit(key, config);
    const blocked = await checkRateLimit(key, config);

    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfter).toBeGreaterThan(0);
  });
});

describe("RATE_LIMITS", () => {
  it("defines register and upload policies", () => {
    expect(RATE_LIMITS.register.limit).toBe(5);
    expect(RATE_LIMITS.upload.limit).toBe(10);
  });

  it("builds scoped rate limit keys", () => {
    expect(rateLimitKey("upload", "1.1.1.1", "user-1")).toBe(
      "upload:user-1"
    );
    expect(rateLimitKey("register", "1.1.1.1")).toBe("register:1.1.1.1");
  });
});