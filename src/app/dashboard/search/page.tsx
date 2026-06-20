import { Search } from "lucide-react";
import { SearchBar } from "@/components/search/search-bar";

export default function SearchPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <Search className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">混合搜索</h1>
            <p className="mt-1 text-muted-foreground">
              关键词 + 语义混合搜索：结合 PostgreSQL 全文检索与 AI
              向量嵌入，同时匹配精确关键词与自然语言含义
            </p>
          </div>
        </div>
      </div>
      <SearchBar />
    </div>
  );
}