"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const MDPreview = dynamic(
  () =>
    import("@uiw/react-md-editor").then((mod) => {
      const Editor = mod.default;
      return function MarkdownPreview({ source }: { source: string }) {
        return <Editor.Markdown source={source} />;
      };
    }),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[300px] w-full" />,
  }
);

interface MarkdownViewerProps {
  content: string;
}

export function MarkdownViewer({ content }: MarkdownViewerProps) {
  return (
    <div data-color-mode="light" className="prose prose-neutral max-w-none">
      <MDPreview source={content} />
    </div>
  );
}