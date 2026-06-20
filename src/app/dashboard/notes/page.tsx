import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NoteCard } from "@/components/notes/note-card";
import { NoteIoPanel } from "@/components/notes/note-io-panel";

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

      {notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="mb-4 text-lg text-muted-foreground">
            还没有笔记，创建你的第一条吧！
          </p>
          <Link href="/dashboard/notes/new">
            <Button size="lg">
              <PenLine className="mr-2 h-4 w-4" />
              新建笔记
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {notes.map((note) => (
            <NoteCard key={note.id} {...note} />
          ))}
        </div>
      )}
    </div>
  );
}