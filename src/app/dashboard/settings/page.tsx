"use client";

import { useCallback, useEffect, useState } from "react";
import { Copy, KeyRound, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  const [token, setToken] = useState<string | null>(null);
  const [configured, setConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchToken = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/clip-token", { cache: "no-store" });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error ?? "加载剪藏设置失败");
      }
      setConfigured(!!data?.configured);
      setToken(data?.token ?? null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "加载剪藏设置失败"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchToken();
  }, [fetchToken]);

  const generateToken = async () => {
    if (
      configured &&
      !confirm("重新生成将使旧令牌失效，浏览器扩展需重新配置。继续？")
    ) {
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch("/api/clip-token", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "生成失败");

      setToken(data.token);
      setConfigured(true);
      toast.success("剪藏令牌已生成");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "生成失败");
    } finally {
      setGenerating(false);
    }
  };

  const copyToken = async () => {
    if (!token) return;
    await navigator.clipboard.writeText(token);
    toast.success("已复制到剪贴板");
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">设置</h1>
        <p className="mt-1 text-muted-foreground">管理浏览器剪藏等集成</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            浏览器剪藏
          </CardTitle>
          <CardDescription>
            在 Chrome 扩展中填入此令牌，即可将网页内容保存到 NoteFlow
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              readOnly
              value={loading ? "加载中..." : token ?? "尚未配置"}
              className="font-mono text-sm"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={copyToken}
              disabled={!token}
              aria-label="复制令牌"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>

          <Button onClick={generateToken} disabled={generating || loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            {generating
              ? "生成中..."
              : configured
                ? "重新生成令牌"
                : "生成剪藏令牌"}
          </Button>

          <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
            <p className="mb-2 font-medium text-foreground">安装 Chrome 扩展</p>
            <ol className="list-decimal space-y-1 pl-5">
              <li>打开 Chrome → 扩展程序 → 管理扩展程序</li>
              <li>开启「开发者模式」</li>
              <li>点击「加载已解压的扩展程序」，选择项目中的 extension 文件夹</li>
              <li>点击扩展图标，填入 NoteFlow 地址与剪藏令牌</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}