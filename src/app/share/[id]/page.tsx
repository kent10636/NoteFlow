import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { MarkdownViewer } from "@/components/notes/markdown-viewer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const note = await prisma.note.findFirst({
    where: { id, published: true },
    select: { title: true, summary: true },
  });

  if (!note) {
    return { title: "笔记不存在" };
  }

  return {
    title: `${note.title} · NoteFlow`,
    description: note.summary ?? undefined,
  };
}

export default async function SharedNotePage({ params }: PageProps) {
  const { id } = await params;

  const note = await prisma.note.findFirst({
    where: { id, published: true },
    select: {
      id: true,
      title: true,
      content: true,
      summary: true,
      tags: true,
      updatedAt: true,
      user: { select: { name: true } },
    },
  });

  if (!note) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 text-sm font-medium">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </div>
            NoteFlow
          </Link>
          <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/login" />}>
            登录 / 注册
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-6 space-y-3">
          <h1 className="text-3xl font-bold tracking-tight">{note.title}</h1>
          {note.user.name && (
            <p className="text-sm text-muted-foreground">
              作者：{note.user.name}
            </p>
          )}
          {note.summary && (
            <p className="rounded-lg border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
              {note.summary}
            </p>
          )}
          {note.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {note.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <MarkdownViewer content={note.content} />

        <p className="mt-10 text-center text-xs text-muted-foreground">
          由 NoteFlow 分享 · 更新于 {note.updatedAt.toLocaleDateString("zh-CN")}
        </p>
      </main>
    </div>
  );
}