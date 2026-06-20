import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateClipToken } from "@/lib/clip-auth";

function clipTokenErrorResponse(error: unknown) {
  console.error("Clip token error:", error);

  if (
    error instanceof Prisma.PrismaClientValidationError ||
    (error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2022")
  ) {
    return NextResponse.json(
      {
        error:
          "剪藏功能数据库未就绪，请稍后重试或联系管理员同步数据库 schema",
      },
      { status: 503 }
    );
  }

  return NextResponse.json({ error: "剪藏设置加载失败" }, { status: 500 });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { clipToken: true },
    });

    return NextResponse.json({
      configured: !!user?.clipToken,
      token: user?.clipToken ?? null,
    });
  } catch (error) {
    return clipTokenErrorResponse(error);
  }
}

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  try {
    const token = generateClipToken();

    await prisma.user.update({
      where: { id: session.user.id },
      data: { clipToken: token },
    });

    return NextResponse.json({ token });
  } catch (error) {
    return clipTokenErrorResponse(error);
  }
}