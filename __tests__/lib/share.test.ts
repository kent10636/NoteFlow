import { describe, it, expect } from "vitest";
import { buildShareUrl } from "@/lib/share";

describe("buildShareUrl", () => {
  it("builds share url from base and note id", () => {
    expect(buildShareUrl("note-123", "https://app.example.com")).toBe(
      "https://app.example.com/share/note-123"
    );
  });

  it("strips trailing slash from base url", () => {
    expect(buildShareUrl("abc", "https://app.example.com/")).toBe(
      "https://app.example.com/share/abc"
    );
  });

  it("falls back to NEXTAUTH_URL when baseUrl omitted", () => {
    const original = process.env.NEXTAUTH_URL;
    process.env.NEXTAUTH_URL = "https://noteflow.example.com/";
    expect(buildShareUrl("note-1")).toBe(
      "https://noteflow.example.com/share/note-1"
    );
    process.env.NEXTAUTH_URL = original;
  });
});