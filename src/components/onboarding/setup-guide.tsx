"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  Rocket,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SetupStep {
  id: string;
  title: string;
  done: boolean;
  href?: string;
}

interface SetupStatus {
  showOnboarding: boolean;
  isFirstTime: boolean;
  noteCount: number;
  steps: SetupStep[];
  env: {
    valid: boolean;
    missing: string[];
    warnings: string[];
    optional: { key: string; configured: boolean; description: string }[];
  };
}

export function SetupGuide() {
  const [status, setStatus] = useState<SetupStatus | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch("/api/setup/status");
        if (res.ok) {
          const data = await res.json();
          setStatus(data);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchStatus();
  }, []);

  if (loading || !status || dismissed || !status.showOnboarding) {
    return null;
  }

  const completedSteps = status.steps.filter((s) => s.done).length;
  const progress = Math.round((completedSteps / status.steps.length) * 100);

  return (
    <Card className="mb-8 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
      <CardHeader className="flex flex-row items-start justify-between pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            {status.isFirstTime ? (
              <Rocket className="h-5 w-5 text-primary" />
            ) : (
              <Sparkles className="h-5 w-5 text-primary" />
            )}
          </div>
          <div>
            <CardTitle className="text-lg">
              {status.isFirstTime ? "欢迎使用 NoteFlow！" : "完善你的设置"}
            </CardTitle>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {status.isFirstTime
                ? "跟随引导，几分钟内搭建你的知识库"
                : `已完成 ${completedSteps}/${status.steps.length} 步 (${progress}%)`}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => setDismissed(true)}
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {status.steps.map((step) => (
            <div
              key={step.id}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                step.done
                  ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30"
                  : "border-border"
              }`}
            >
              {step.done ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
              ) : (
                <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              {step.href && !step.done ? (
                <Link href={step.href} className="hover:text-primary hover:underline">
                  {step.title}
                </Link>
              ) : (
                <span className={step.done ? "text-muted-foreground" : ""}>
                  {step.title}
                </span>
              )}
            </div>
          ))}
        </div>

        {!status.env.valid && status.env.missing.length > 0 && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-destructive">
              <AlertTriangle className="h-4 w-4" />
              缺少必要环境变量
            </div>
            <ul className="space-y-1 text-xs text-muted-foreground">
              {status.env.missing.map((m) => (
                <li key={m}>• {m}</li>
              ))}
            </ul>
          </div>
        )}

        {status.env.warnings.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {status.env.warnings.map((w) => (
              <Badge key={w} variant="outline" className="text-xs">
                {w}
              </Badge>
            ))}
          </div>
        )}

        {status.isFirstTime && (
          <Link href="/dashboard/notes/new">
            <Button className="gap-2">
              <Rocket className="h-4 w-4" />
              创建第一条笔记
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}