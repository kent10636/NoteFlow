export function buildShareUrl(noteId: string, baseUrl?: string): string {
  const origin =
    baseUrl?.replace(/\/$/, "") ||
    process.env.NEXTAUTH_URL?.replace(/\/$/, "") ||
    "";
  return `${origin}/share/${noteId}`;
}