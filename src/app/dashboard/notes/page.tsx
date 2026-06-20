import Link from "next/link";
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NoteIoPanel } from "@/components/notes/note-io-panel";
import { NotesList } from "@/components/notes/notes-list";
import { Skeleton } from "@/components/ui/skeleton";

export default async function NotesPage() {
  const session = await auth();

  const notes = await prisma.note.findMany({
    where: { userId: session?.user?.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      content: true,
      summary: true,
      tags: true,
      updatedAt: true,
    },
  });

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">我的笔记</h1>
          <p className="mt-1 text-muted-foreground">
            共 {notes.length} 条笔记
          </p>
        </div>
        <div className="flex gap-2">
          <NoteIoPanel />
          <Link href="/dashboard/notes/new">
            <Button className="gap-2">
              <PenLine className="h-4 w-4" />
              新建笔记
            </Button>
          </Link>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>
        }
      >
        <NotesList
          notes={notes.map((note) => ({
            ...note,
            updatedAt: note.updatedAt.toISOString(),
          }))}
        />
      </Suspense>
    </div>
  );
}