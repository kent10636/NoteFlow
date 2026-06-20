"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { CalendarDays, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const MDPreview = dynamic(
  () =>
    import("@uiw/react-md-editor").then((mod) => {
      const Preview = mod.default.Markdown;
      return function MarkdownPreview({ source }: { source: string }) {
        return <Preview source={source} />;
      };
    }),
  { ssr: false, loading: () => <Skeleton className="h-64 w-full" /> }
);

interface DailyReviewData {
  content: string;
  noteCount: number;
  createdAt?: string;
}

export default function DailyReviewPage() {
  const [review, setReview] = useState<DailyReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchReview = useCallback(async () => {
    try {
      const res = await fetch("/api/ai/daily-review");
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.content) {
        setReview(data);
      } else {
        setReview(null);
      }
    } catch {
      toast.error("加载回顾失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReview();
  }, [fetchReview]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/daily-review", { method: "POST" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setReview(data);
      toast.success("每日回顾已生成");
    } catch {
      toast.error("生成失败");
    } finally {
      setGenerating(false);
    }
  };

  const today = new Date().toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CalendarDays className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">每日 AI 回顾</h1>
            <p className="mt-1 text-muted-foreground">{today}</p>
          </div>
        </div>
        <Button onClick={handleGenerate} disabled={generating}>
          {generating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : review ? (
            <RefreshCw className="mr-2 h-4 w-4" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          {generating ? "生成中..." : review ? "重新生成" : "生成今日回顾"}
        </Button>
      </div>

      {loading ? (
        <Skeleton className="h-96 w-full rounded-lg" />
      ) : review ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>今日学习回顾</CardTitle>
            <Badge variant="secondary">{review.noteCount} 条笔记</Badge>
          </CardHeader>
          <CardContent data-color-mode="light">
            <MDPreview source={review.content} />
          </CardContent>
        </Card>
      ) : (
        <Card className="flex flex-col items-center justify-center py-20">
          <CalendarDays className="mb-4 h-16 w-16 text-muted-foreground/30" />
          <h2 className="mb-2 text-xl font-semibold">还没有今日回顾</h2>
          <p className="mb-6 text-muted-foreground">
            点击按钮，AI 将为你总结今天的所有笔记
          </p>
          <Button size="lg" onClick={handleGenerate} disabled={generating}>
            <Sparkles className="mr-2 h-4 w-4" />
            生成今日回顾
          </Button>
        </Card>
      )}
    </div>
  );
}