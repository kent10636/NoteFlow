import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { checkEnv, isDatabaseConfigured } from "@/lib/env";

describe("checkEnv", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should report missing vars when DATABASE_URL is absent", () => {
    delete process.env.DATABASE_URL;
    const result = checkEnv();
    expect(result.valid).toBe(false);
    expect(result.missing.some((m) => m.includes("DATABASE_URL"))).toBe(true);
  });

  it("should be valid when all required vars are set", () => {
    process.env.DATABASE_URL = "postgresql://localhost/test";
    process.env.NEXTAUTH_URL = "http://localhost:3000";
    process.env.AUTH_SECRET = "test-secret";
    const result = checkEnv();
    expect(result.valid).toBe(true);
    expect(result.missing).toHaveLength(0);
  });

  it("should accept NEXTAUTH_SECRET as alternative to AUTH_SECRET", () => {
    process.env.DATABASE_URL = "postgresql://localhost/test";
    process.env.NEXTAUTH_URL = "http://localhost:3000";
    delete process.env.AUTH_SECRET;
    process.env.NEXTAUTH_SECRET = "test-secret";
    const result = checkEnv();
    expect(result.valid).toBe(true);
  });

  it("should warn about missing XAI_API_KEY in production", () => {
    process.env.DATABASE_URL = "postgresql://localhost/test";
    process.env.NEXTAUTH_URL = "https://app.vercel.app";
    process.env.AUTH_SECRET = "secret";
    process.env.NODE_ENV = "production";
    delete process.env.XAI_API_KEY;
    const result = checkEnv();
    expect(result.warnings.some((w) => w.includes("XAI_API_KEY"))).toBe(true);
  });
});

describe("isDatabaseConfigured", () => {
  it("should return true when DATABASE_URL is set", () => {
    process.env.DATABASE_URL = "postgresql://localhost/test";
    expect(isDatabaseConfigured()).toBe(true);
  });
});