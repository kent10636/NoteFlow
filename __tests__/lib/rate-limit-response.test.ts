import { describe, it, expect } from "vitest";
import { rateLimitedResponse } from "@/lib/rate-limit-response";

describe("rateLimitedResponse", () => {
  it("returns 429 with default message", async () => {
    const res = rateLimitedResponse({
      allowed: false,
      remaining: 0,
      retryAfter: 120,
    });

    expect(res.status).toBe(429);
    const data = await res.json();
    expect(data.error).toBe("请求过于频繁，请稍后再试");
    expect(res.headers.get("Retry-After")).toBe("120");
    expect(res.headers.get("X-RateLimit-Remaining")).toBe("0");
  });

  it("uses custom message and defaults retryAfter to 60", async () => {
    const res = rateLimitedResponse(
      { allowed: false, remaining: -2, retryAfter: 0 },
      "注册过于频繁，请 15 分钟后再试"
    );

    const data = await res.json();
    expect(data.error).toBe("注册过于频繁，请 15 分钟后再试");
    expect(res.headers.get("Retry-After")).toBe("60");
    expect(res.headers.get("X-RateLimit-Remaining")).toBe("0");
  });
});