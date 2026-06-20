import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BookOpen, GitBranch, PenLine, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NoteCard } from "@/components/notes/note-card";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session?.user?.id;

  const [noteCount, linkCount, recentNotes] = await Promise.all([
    prisma.note.count({ where: { userId } }),
    prisma.noteLink.count({
      where: { fromNote: { userId } },
    }),
    prisma.note.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 6,
      select: {
        id: true,
        title: true,
        content: true,
        summary: true,
        tags: true,
        updatedAt: true,
      },
    }),
  ]);

  const stats = [
    { label: "笔记总数", value: noteCount, icon: BookOpen },
    { label: "知识关联", value: linkCount, icon: GitBranch },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          你好，{session?.user?.name ?? "用户"} 👋
        </h1>
        <p className="mt-1 text-muted-foreground">
          欢迎回到 NoteFlow，继续构建你的知识库吧。
        </p>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              快捷操作
            </CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Link href="/dashboard/notes/new">
              <Button size="sm" className="gap-1">
                <PenLine className="h-3 w-3" /> 新建
              </Button>
            </Link>
            <Link href="/dashboard/search">
              <Button size="sm" variant="outline" className="gap-1">
                <Search className="h-3 w-3" /> 搜索
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">最近笔记</h2>
          <Link href="/dashboard/notes">
            <Button variant="ghost" size="sm">
              查看全部
            </Button>
          </Link>
        </div>

        {recentNotes.length === 0 ? (
          <Card className="flex flex-col items-center justify-center py-16">
            <BookOpen className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="mb-4 text-muted-foreground">还没有笔记，开始创建吧！</p>
            <Link href="/dashboard/notes/new">
              <Button>
                <PenLine className="mr-2 h-4 w-4" />
                创建第一条笔记
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recentNotes.map((note) => (
              <NoteCard key={note.id} {...note} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}