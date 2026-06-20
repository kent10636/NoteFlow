import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  isBlobStorageConfigured,
  isUploadStorageReady,
  requiresBlobStorage,
} from "@/lib/storage";

describe("storage", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("detects blob storage from BLOB_READ_WRITE_TOKEN", () => {
    process.env.BLOB_READ_WRITE_TOKEN = "test-token";
    expect(isBlobStorageConfigured()).toBe(true);
  });

  it("detects blob storage from OIDC credentials", () => {
    delete process.env.BLOB_READ_WRITE_TOKEN;
    process.env.BLOB_STORE_ID = "store_abc";
    process.env.VERCEL_OIDC_TOKEN = "oidc-token";
    expect(isBlobStorageConfigured()).toBe(true);
  });

  it("requires blob storage on Vercel", () => {
    process.env.VERCEL = "1";
    expect(requiresBlobStorage()).toBe(true);
  });

  it("reports upload storage unavailable on Vercel without blob", () => {
    process.env.VERCEL = "1";
    delete process.env.BLOB_READ_WRITE_TOKEN;
    delete process.env.BLOB_STORE_ID;
    delete process.env.VERCEL_OIDC_TOKEN;
    expect(isUploadStorageReady()).toBe(false);
  });

  it("allows local upload storage in development", () => {
    delete process.env.VERCEL;
    delete process.env.BLOB_READ_WRITE_TOKEN;
    expect(isUploadStorageReady()).toBe(true);
  });
});