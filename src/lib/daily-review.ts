import { chatCompletion } from "@/lib/ai";

export interface DailyNoteInput {
  title: string;
  content: string;
  tags: string[];
  summary: string | null;
}

/** Generate a daily review summary from today's notes */
export async function generateDailyReview(
  notes: DailyNoteInput[],
  dateLabel: string
): Promise<string> {
  if (notes.length === 0) {
    return `## ${dateLabel} 每日回顾\n\n今天还没有创建或更新笔记。开始记录你的想法吧！`;
  }

  const notesText = notes
    .map(
      (n, i) =>
        `### 笔记 ${i + 1}: ${n.title}\n标签: ${n.tags.join(", ") || "无"}\n${n.summary || n.content.slice(0, 300)}`
    )
    .join("\n\n");

  const result = await chatCompletion(
    `You are a personal knowledge assistant. Generate a thoughtful daily review in Markdown format in Chinese. Include: 1) Overview of today's learning, 2) Key themes and insights, 3) Knowledge connections, 4) Suggestions for tomorrow. Be encouraging and insightful.`,
    `Date: ${dateLabel}\nTotal notes: ${notes.length}\n\n${notesText}`
  );

  return `## ${dateLabel} 每日回顾\n\n${result}`;
}