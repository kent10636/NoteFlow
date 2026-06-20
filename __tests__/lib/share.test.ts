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
});