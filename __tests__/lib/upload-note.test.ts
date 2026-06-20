import { describe, expect, it } from "vitest";
import {
  buildNoteContentFromUpload,
  buildNoteTagsFromUpload,
  buildNoteTitleFromFileName,
  shouldAutoCreateNote,
} from "@/lib/upload-note";

describe("upload-note", () => {
  describe("buildNoteTitleFromFileName", () => {
    it("strips common file extensions", () => {
      expect(buildNoteTitleFromFileName("report.pdf")).toBe("report");
      expect(buildNoteTitleFromFileName("scan-2026.png")).toBe("scan-2026");
    });

    it("keeps names without extensions", () => {
      expect(buildNoteTitleFromFileName("meeting-notes")).toBe("meeting-notes");
    });

    it("handles dotted base names", () => {
      expect(buildNoteTitleFromFileName("archive.v2.pdf")).toBe("archive.v2");
    });

    it("falls back for empty input", () => {
      expect(buildNoteTitleFromFileName("")).toBe("未命名附件");
      expect(buildNoteTitleFromFileName("   ")).toBe("未命名附件");
    });
  });

  describe("buildNoteContentFromUpload", () => {
    it("includes attachment heading and OCR text", () => {
      const content = buildNoteContentFromUpload({
        fileName: "invoice.pdf",
        ocrText: "Total: 128.00",
        url: "https://cdn.example.com/invoice.pdf",
      });

      expect(content).toContain("## 附件: invoice.pdf");
      expect(content).toContain("来源: https://cdn.example.com/invoice.pdf");
      expect(content).toContain("Total: 128.00");
    });

    it("omits OCR section when text is empty", () => {
      const content = buildNoteContentFromUpload({
        fileName: "photo.jpg",
        ocrText: "   ",
      });

      expect(content).toBe("## 附件: photo.jpg");
    });
  });

  describe("buildNoteTagsFromUpload", () => {
    it("tags images and PDFs differently", () => {
      expect(buildNoteTagsFromUpload("image/png")).toEqual(["上传", "图片"]);
      expect(buildNoteTagsFromUpload("application/pdf")).toEqual(["上传", "PDF"]);
    });
  });

  describe("shouldAutoCreateNote", () => {
    it("creates a note when requested and no note is linked", () => {
      expect(shouldAutoCreateNote({ createNote: true })).toBe(true);
      expect(
        shouldAutoCreateNote({ createNote: true, existingNoteId: null })
      ).toBe(true);
    });

    it("skips creation when a note is already linked", () => {
      expect(
        shouldAutoCreateNote({
          createNote: true,
          existingNoteId: "note_123",
        })
      ).toBe(false);
    });

    it("skips creation when auto-create is disabled", () => {
      expect(shouldAutoCreateNote({ createNote: false })).toBe(false);
    });
  });
});