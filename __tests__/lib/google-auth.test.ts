import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { isGoogleAuthConfigured } from "@/lib/google-auth";

describe("isGoogleAuthConfigured", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns false when credentials are missing", () => {
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    expect(isGoogleAuthConfigured()).toBe(false);
  });

  it("returns true when both credentials are set", () => {
    process.env.GOOGLE_CLIENT_ID = "client-id";
    process.env.GOOGLE_CLIENT_SECRET = "client-secret";
    expect(isGoogleAuthConfigured()).toBe(true);
  });
});