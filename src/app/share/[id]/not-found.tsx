import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function SharedNoteNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold">笔记不存在或未公开</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        该链接可能已失效，或作者已将笔记设为私密。
      </p>
      <Button nativeButton={false} render={<Link href="/" />}>
        返回首页
      </Button>
    </div>
  );
}