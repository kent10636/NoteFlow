import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { semanticSearch } from "@/lib/embeddings";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  try {
    const { query, limit } = await request.json();

    if (!query?.trim()) {
      return NextResponse.json({ error: "搜索关键词不能为空" }, { status: 400 });
    }

    const results = await semanticSearch(
      session.user.id,
      query.trim(),
      limit ?? 10
    );

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "搜索失败" }, { status: 500 });
  }
}