import { createWorker } from "tesseract.js";

const XAI_API_URL = "https://api.x.ai/v1";

/** Extract text from PDF buffer */
export async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    const pdfModule = await import("pdf-parse");
    const pdfParse =
      "default" in pdfModule && pdfModule.default
        ? pdfModule.default
        : pdfModule;
    const data = await (pdfParse as (buf: Buffer) => Promise<{ text?: string }>)(
      buffer
    );
    return data.text?.trim() ?? "";
  } catch (error) {
    console.error("PDF parse error:", error);
    return "";
  }
}

/** Extract text from image buffer using Tesseract OCR */
export async function extractImageText(buffer: Buffer): Promise<string> {
  let worker;
  try {
    worker = await createWorker("chi_sim+eng");
    const {
      data: { text },
    } = await worker.recognize(buffer);
    return text?.trim() ?? "";
  } catch (error) {
    console.error("OCR error:", error);
    return "";
  } finally {
    if (worker) await worker.terminate();
  }
}

/** Use xAI vision for enhanced OCR when API key is available */
export async function extractWithVision(
  base64: string,
  mimeType: string
): Promise<string> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return "";

  try {
    const response = await fetch(`${XAI_API_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-2-vision-1212",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract all text from this image/document. Return only the extracted text, preserving structure where possible. Use the same language as the source.",
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64}`,
                },
              },
            ],
          },
        ],
        max_tokens: 4096,
      }),
    });

    if (!response.ok) return "";

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() ?? "";
  } catch {
    return "";
  }
}

/** Process uploaded file and extract text */
export async function processFileOcr(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  const base64 = buffer.toString("base64");

  // Try vision API first for images
  if (mimeType.startsWith("image/")) {
    const visionText = await extractWithVision(base64, mimeType);
    if (visionText) return visionText;
    return extractImageText(buffer);
  }

  if (mimeType === "application/pdf") {
    const pdfText = await extractPdfText(buffer);
    if (pdfText) return pdfText;
    const visionText = await extractWithVision(base64, mimeType);
    return visionText || "【PDF 解析失败，未能提取文本】";
  }

  return "";
}