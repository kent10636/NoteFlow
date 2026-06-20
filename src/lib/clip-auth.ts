import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

export function generateClipToken(): string {
  return randomBytes(24).toString("base64url");
}

export function hashClipToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function resolveUserFromClipToken(
  authorization: string | null
): Promise<string | null> {
  if (!authorization?.startsWith("Bearer ")) return null;

  const token = authorization.slice(7).trim();
  if (!token) return null;

  const user = await prisma.user.findFirst({
    where: { clipToken: token },
    select: { id: true },
  });

  return user?.id ?? null;
}