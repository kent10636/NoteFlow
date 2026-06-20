import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateDailyReview } from "@/lib/daily-review";

function getTodayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existing = await prisma.dailyReview.findUnique({
    where: {
      userId_date: { userId: session.user.id, date: today },
    },
  });

  if (existing) {
    return NextResponse.json(existing);
  }

  return NextResponse.json({ content: null, noteCount: 0 });
}

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  try {
    const { start, end } = getTodayRange();
    const dateLabel = start.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    });

    const notes = await prisma.note.findMany({
      where: {
        userId: session.user.id,
        OR: [
          { createdAt: { gte: start, lte: end } },
          { updatedAt: { gte: start, lte: end } },
        ],
      },
      select: {
        title: true,
        content: true,
        tags: true,
        summary: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    const content = await generateDailyReview(notes, dateLabel);

    const review = await prisma.dailyReview.upsert({
      where: {
        userId_date: { userId: session.user.id, date: start },
      },
      create: {
        date: start,
        content,
        noteCount: notes.length,
        userId: session.user.id,
      },
      update: {
        content,
        noteCount: notes.length,
      },
    });

    return NextResponse.json(review);
  } catch (error) {
    console.error("Daily review error:", error);
    return NextResponse.json({ error: "生成每日回顾失败" }, { status: 500 });
  }
}