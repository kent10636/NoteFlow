import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkEnv } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const env = checkEnv();

  const [noteCount, hasReview] = await Promise.all([
    prisma.note.count({ where: { userId: session.user.id } }),
    prisma.dailyReview.count({ where: { userId: session.user.id } }),
  ]);

  const isFirstTime = noteCount === 0;
  const showOnboarding = isFirstTime || !env.valid || env.warnings.length > 0;

  return NextResponse.json({
    showOnboarding,
    isFirstTime,
    noteCount,
    hasReview,
    env: {
      valid: env.valid,
      missing: env.missing,
      warnings: env.warnings,
      optional: env.optional,
    },
    steps: [
      {
        id: "register",
        title: "创建账号",
        done: true,
      },
      {
        id: "note",
        title: "创建第一条笔记",
        done: noteCount > 0,
        href: "/dashboard/notes/new",
      },
      {
        id: "ai",
        title: "体验 AI 摘要",
        done: noteCount > 0,
        href: noteCount > 0 ? "/dashboard/notes" : "/dashboard/notes/new",
      },
      {
        id: "search",
        title: "尝试语义搜索",
        done: noteCount > 1,
        href: "/dashboard/search",
      },
      {
        id: "review",
        title: "生成每日回顾",
        done: hasReview > 0,
        href: "/dashboard/review",
      },
    ],
  });
}