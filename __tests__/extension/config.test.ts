import { describe, it, expect } from "vitest";
import { normalizeBaseUrl, validateClipConfig } from "../../extension/config.js";

describe("config", () => {
  describe("normalizeBaseUrl", () => {
    it("trims whitespace and strips trailing slash", () => {
      expect(normalizeBaseUrl("  https://app.example.com/  ")).toBe(
        "https://app.example.com"
      );
    });

    it("keeps url without trailing slash", () => {
      expect(normalizeBaseUrl("https://app.example.com")).toBe(
        "https://app.example.com"
      );
    });
  });

  describe("validateClipConfig", () => {
    it("returns null for valid config", () => {
      expect(validateClipConfig("https://app.example.com/", "token-123")).toBeNull();
    });

    it("returns error when baseUrl is missing", () => {
      expect(validateClipConfig("  ", "token-123")).toBe("请填写地址和令牌");
    });

    it("returns error when token is missing", () => {
      expect(validateClipConfig("https://app.example.com", "  ")).toBe(
        "请填写地址和令牌"
      );
    });

    it("returns error when both are missing", () => {
      expect(validateClipConfig("", "")).toBe("请填写地址和令牌");
    });
  });
});