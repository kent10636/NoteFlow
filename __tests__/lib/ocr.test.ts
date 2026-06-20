import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockRecognize = vi.fn();
const mockTerminate = vi.fn();
const mockCreateWorker = vi.fn(async () => ({
  recognize: mockRecognize,
  terminate: mockTerminate,
}));
const mockPdfParse = vi.fn();

vi.mock("tesseract.js", () => ({
  createWorker: (...args: unknown[]) => mockCreateWorker(...args),
}));

vi.mock("pdf-parse", () => ({
  default: (...args: unknown[]) => mockPdfParse(...args),
}));

import {
  extractImageText,
  extractPdfText,
  extractWithVision,
  processFileOcr,
} from "@/lib/ocr";

describe("OCR utilities", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    delete process.env.VERCEL;
    delete process.env.XAI_API_KEY;
    mockRecognize.mockResolvedValue({ data: { text: "  OCR 文本  " } });
    mockPdfParse.mockResolvedValue({ text: "  PDF 正文  " });
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.unstubAllGlobals();
  });

  it("extractPdfText returns trimmed text", async () => {
    const text = await extractPdfText(Buffer.from("pdf"));
    expect(text).toBe("PDF 正文");
    expect(mockPdfParse).toHaveBeenCalled();
  });

  it("extractPdfText returns empty string on parse failure", async () => {
    mockPdfParse.mockRejectedValue(new Error("bad pdf"));
    expect(await extractPdfText(Buffer.from("bad"))).toBe("");
  });

  it("extractImageText skips OCR on Vercel without XAI key", async () => {
    process.env.VERCEL = "1";
    const text = await extractImageText(Buffer.from("img"));
    expect(text).toContain("未配置 XAI_API_KEY");
    expect(mockCreateWorker).not.toHaveBeenCalled();
  });

  it("extractImageText uses Tesseract locally", async () => {
    const text = await extractImageText(Buffer.from("img"));
    expect(text).toBe("OCR 文本");
    expect(mockCreateWorker).toHaveBeenCalledWith("chi_sim+eng");
    expect(mockTerminate).toHaveBeenCalled();
  });

  it("extractWithVision returns empty string without API key", async () => {
    expect(await extractWithVision("abc", "image/png")).toBe("");
  });

  it("extractWithVision returns model output", async () => {
    process.env.XAI_API_KEY = "test-key";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: "  Vision 结果  " } }],
        }),
      }))
    );

    const text = await extractWithVision("abc", "image/png");
    expect(text).toBe("Vision 结果");
  });

  it("processFileOcr prefers vision for images when key is set", async () => {
    process.env.XAI_API_KEY = "test-key";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: "图片文字" } }],
        }),
      }))
    );

    const text = await processFileOcr(Buffer.from("img"), "image/png");
    expect(text).toBe("图片文字");
    expect(mockCreateWorker).not.toHaveBeenCalled();
  });

  it("processFileOcr falls back to Tesseract for images without vision result", async () => {
    const text = await processFileOcr(Buffer.from("img"), "image/jpeg");
    expect(text).toBe("OCR 文本");
  });

  it("processFileOcr extracts PDF text", async () => {
    const text = await processFileOcr(Buffer.from("pdf"), "application/pdf");
    expect(text).toBe("PDF 正文");
  });

  it("processFileOcr returns PDF failure message when extraction fails", async () => {
    mockPdfParse.mockResolvedValue({ text: "" });
    const text = await processFileOcr(Buffer.from("pdf"), "application/pdf");
    expect(text).toBe("【PDF 解析失败，未能提取文本】");
  });

  it("processFileOcr returns empty string for unsupported mime types", async () => {
    expect(await processFileOcr(Buffer.from("x"), "text/plain")).toBe("");
  });
});