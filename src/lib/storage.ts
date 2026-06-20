import { put } from "@vercel/blob";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

export interface StoredFile {
  url: string;
  storage: "blob" | "local";
}

/** Whether Vercel Blob credentials are available */
export function isBlobStorageConfigured(): boolean {
  if (process.env.BLOB_READ_WRITE_TOKEN?.trim()) return true;

  return !!(
    process.env.BLOB_STORE_ID?.trim() && process.env.VERCEL_OIDC_TOKEN?.trim()
  );
}

/** Upload storage must use Blob on Vercel (serverless FS is read-only) */
export function requiresBlobStorage(): boolean {
  return process.env.VERCEL === "1";
}

export function isUploadStorageReady(): boolean {
  if (requiresBlobStorage()) return isBlobStorageConfigured();
  return true;
}

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

/** Persist an uploaded file to Blob (production) or local public/uploads (dev) */
export async function storeUploadedFile(params: {
  userId: string;
  fileName: string;
  mimeType: string;
  buffer: Buffer;
}): Promise<StoredFile> {
  const safeName = `${Date.now()}-${sanitizeFileName(params.fileName)}`;
  const pathname = `uploads/${params.userId}/${safeName}`;

  if (requiresBlobStorage() || isBlobStorageConfigured()) {
    if (!isBlobStorageConfigured()) {
      throw new Error("BLOB_READ_WRITE_TOKEN is not configured");
    }

    const blob = await put(pathname, params.buffer, {
      access: "public",
      contentType: params.mimeType,
      addRandomSuffix: false,
    });

    return { url: blob.url, storage: "blob" };
  }

  const uploadDir = path.join(
    process.cwd(),
    "public",
    "uploads",
    params.userId
  );
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, safeName), params.buffer);

  return {
    url: `/uploads/${params.userId}/${safeName}`,
    storage: "local",
  };
}