"use client";

import { useState } from "react";
import { Search, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SearchResult } from "@/types";
import Link from "next/link";

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      if (!res.ok) throw new Error();

      const data = await res.json();
      setResults(data.results);
      if (data.results.length === 0) {
        toast.info("未找到相关笔记");
      }
    } catch {
      toast.error("搜索失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="用自然语言搜索你的笔记，例如：关于机器学习的笔记..."
            className="pl-10"
          />
        </div>
        <Button type="submit" disabled={loading}>
          <Sparkles className="mr-2 h-4 w-4" />
          {loading ? "搜索中..." : "语义搜索"}
        </Button>
      </form>

      {results.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            找到 {results.length} 条相关笔记
          </p>
          {results.map((result) => (
            <Link key={result.id} href={`/dashboard/notes/${result.id}`}>
              <Card className="transition-all hover:border-primary/50 hover:shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{result.title}</CardTitle>
                    <Badge variant="outline">
                      {(result.similarity * 100).toFixed(0)}% 匹配
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {result.summary || result.content.slice(0, 200)}
                  </p>
                  {result.tags.length > 0 && (
                    <div className="mt-2 flex gap-1">
                      {result.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}