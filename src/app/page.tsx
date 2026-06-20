import Link from "next/link";
import {
  ArrowRight,
  Brain,
  GitBranch,
  Search,
  Sparkles,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Sparkles,
    title: "AI 智能助手",
    description: "一键生成摘要、自动标签、智能推荐相关笔记",
  },
  {
    icon: Search,
    title: "语义搜索",
    description: "基于向量嵌入的自然语言搜索，精准找到所需知识",
  },
  {
    icon: GitBranch,
    title: "知识图谱",
    description: "可视化笔记关联，构建个人知识网络",
  },
  {
    icon: Zap,
    title: "Markdown 编辑",
    description: "富文本 Markdown 编辑器，实时预览，流畅书写",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Brain className="h-4 w-4" />
            </div>
            <span className="text-lg font-bold">NoteFlow</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost">登录</Button>
            </Link>
            <Link href="/register">
              <Button>免费开始</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-6 py-24 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-sm">
            <Sparkles className="h-4 w-4 text-primary" />
            AI 驱动的智能笔记管理
          </div>
          <h1 className="mb-6 text-5xl font-bold tracking-tight">
            让你的知识
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {" "}
              流动起来
            </span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground">
            NoteFlow 是一款智能个人知识笔记 SaaS，集 Markdown 编辑、AI
            辅助、语义搜索和知识图谱于一体，助你高效管理知识。
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="gap-2">
                立即开始 <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline">
                已有账号？登录
              </Button>
            </Link>
          </div>
        </section>

        <section className="border-t bg-muted/30 py-20">
          <div className="mx-auto grid max-w-6xl gap-8 px-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="rounded-xl border bg-card p-6 transition-shadow hover:shadow-md"
                >
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="mb-2 font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        © 2026 NoteFlow. 智能个人知识笔记 SaaS.
      </footer>
    </div>
  );
}