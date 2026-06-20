import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  checkRateLimit,
  getClientIp,
  rateLimitKey,
  RATE_LIMITS,
} from "@/lib/rate-limit";
import { rateLimitedResponse } from "@/lib/rate-limit-response";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limit = await checkRateLimit(
    rateLimitKey("register", ip),
    RATE_LIMITS.register
  );
  if (!limit.allowed) {
    return rateLimitedResponse(limit, "注册过于频繁，请 15 分钟后再试");
  }

  try {
    const { name, email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "邮箱和密码为必填项" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "密码至少需要 6 个字符" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "该邮箱已被注册" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name: name || email.split("@")[0],
        email,
        password: hashedPassword,
      },
      select: { id: true, name: true, email: true },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "注册失败，请稍后重试" },
      { status: 500 }
    );
  }
}