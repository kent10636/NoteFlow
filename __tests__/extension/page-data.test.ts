import { describe, it, expect } from "vitest";
import {
  getSelectionText,
  getMetaDescription,
  extractPageData,
} from "../../extension/page-data.js";

describe("page-data", () => {
  it("getSelectionText returns trimmed selection", () => {
    const win = {
      getSelection: () => ({
        toString: () => "  selected text  ",
      }),
    } as unknown as Window;

    expect(getSelectionText(win)).toBe("selected text");
  });

  it("getSelectionText returns empty string when no selection", () => {
    const win = {
      getSelection: () => null,
    } as unknown as Window;

    expect(getSelectionText(win)).toBe("");
  });

  it("getMetaDescription reads meta description content", () => {
    const doc = {
      querySelector: (selector: string) =>
        selector === 'meta[name="description"]'
          ? { getAttribute: (name: string) => (name === "content" ? "  Page desc  " : null) }
          : null,
    } as unknown as Document;

    expect(getMetaDescription(doc)).toBe("Page desc");
  });

  it("getMetaDescription returns empty string when meta is missing", () => {
    const doc = {
      querySelector: () => null,
    } as unknown as Document;

    expect(getMetaDescription(doc)).toBe("");
  });

  it("extractPageData combines title, url, selection and description", () => {
    const win = {
      location: { href: "https://example.com/page" },
      getSelection: () => ({
        toString: () => "highlighted",
      }),
    } as unknown as Window;

    const doc = {
      title: "Example Page",
      querySelector: () => ({
        getAttribute: () => "A sample page",
      }),
    } as unknown as Document;

    expect(extractPageData(win, doc)).toEqual({
      title: "Example Page",
      url: "https://example.com/page",
      selection: "highlighted",
      content: "A sample page",
    });
  });
});