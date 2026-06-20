export interface NoteTemplate {
  id: string;
  name: string;
  description: string;
  title: string;
  content: string;
  tags: string[];
}

export const NOTE_TEMPLATES: NoteTemplate[] = [
  {
    id: "blank",
    name: "空白笔记",
    description: "从零开始",
    title: "",
    content: "",
    tags: [],
  },
  {
    id: "meeting",
    name: "会议记录",
    description: "会议要点与行动项",
    title: "会议记录",
    content: `## 会议信息

- 日期：
- 参与者：

## 议题

1.

## 结论

-

## 行动项

- [ ]
`,
    tags: ["会议"],
  },
  {
    id: "reading",
    name: "读书笔记",
    description: "阅读摘要与思考",
    title: "读书笔记",
    content: `## 基本信息

- 书名：
- 作者：

## 核心观点

-

## 摘录

>

## 我的思考

-
`,
    tags: ["读书"],
  },
  {
    id: "weekly",
    name: "周报",
    description: "本周总结与下周计划",
    title: "周报",
    content: `## 本周完成

-

## 遇到的问题

-

## 下周计划

-
`,
    tags: ["周报"],
  },
];

export function getNoteTemplate(id: string): NoteTemplate {
  return NOTE_TEMPLATES.find((t) => t.id === id) ?? NOTE_TEMPLATES[0];
}