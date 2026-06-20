import { Search } from "lucide-react";
import { SearchBar } from "@/components/search/search-bar";

export default function SearchPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <Search className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">语义搜索</h1>
            <p className="mt-1 text-muted-foreground">
              使用自然语言搜索你的笔记，基于 AI 向量嵌入实现语义理解
            </p>
          </div>
        </div>
      </div>
      <SearchBar />
    </div>
  );
}