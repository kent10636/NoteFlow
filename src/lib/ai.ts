const XAI_API_URL = "https://api.x.ai/v1";

function getApiKey(): string | undefined {
  return process.env.XAI_API_KEY;
}

export async function chatCompletion(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const apiKey = getApiKey();

  if (!apiKey) {
    return fallbackResponse(systemPrompt, userPrompt);
  }

  try {
    const response = await fetch(`${XAI_API_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-3-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      console.error("xAI API error:", await response.text());
      return fallbackResponse(systemPrompt, userPrompt);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content ?? "";
  } catch (error) {
    console.error("xAI API request failed:", error);
    return fallbackResponse(systemPrompt, userPrompt);
  }
}

function fallbackResponse(systemPrompt: string, userPrompt: string): string {
  if (systemPrompt.includes("summary") || systemPrompt.includes("摘要")) {
    const text = userPrompt.slice(0, 200);
    return `【本地摘要】${text}${userPrompt.length > 200 ? "..." : ""}`;
  }
  if (systemPrompt.includes("tag") || systemPrompt.includes("标签")) {
    const words = userPrompt
      .toLowerCase()
      .split(/\W+/)
      .filter((w) => w.length > 4)
      .slice(0, 5);
    return JSON.stringify(words.length > 0 ? words : ["笔记", "知识", "学习"]);
  }
  if (systemPrompt.includes("daily review") || systemPrompt.includes("每日回顾")) {
    const noteCount = userPrompt.match(/Total notes: (\d+)/)?.[1] ?? "0";
    return `今日共记录 **${noteCount}** 条笔记。继续保持学习节奏，知识积累是一个持续的过程。建议明天回顾今日标记的重点内容，并尝试建立笔记之间的关联。`;
  }
  return "[]";
}

/** Generate a concise summary of note content */
export async function generateSummary(content: string): Promise<string> {
  return chatCompletion(
    "You are a helpful assistant. Summarize the following note in 2-3 sentences in the same language as the input. Be concise and capture key points.",
    content
  );
}

/** Generate relevant tags for note content */
export async function generateTags(content: string): Promise<string[]> {
  const result = await chatCompletion(
    'You are a helpful assistant. Generate 3-5 relevant tags for the following note. Return ONLY a JSON array of strings, e.g. ["tag1", "tag2"]. Use the same language as the input.',
    content
  );

  try {
    const parsed = JSON.parse(result);
    if (Array.isArray(parsed)) {
      return parsed.map(String).slice(0, 5);
    }
  } catch {
    // fallback parsing
    const matches = result.match(/"([^"]+)"/g);
    if (matches) {
      return matches.map((m) => m.replace(/"/g, "")).slice(0, 5);
    }
  }

  return ["笔记", "知识"];
}

/** Generate embedding vector for semantic search */
export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = getApiKey();

  if (!apiKey) {
    return localEmbedding(text);
  }

  try {
    const response = await fetch(`${XAI_API_URL}/embeddings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: text.slice(0, 8000),
      }),
    });

    if (!response.ok) {
      return localEmbedding(text);
    }

    const data = await response.json();
    return data.data?.[0]?.embedding ?? localEmbedding(text);
  } catch {
    return localEmbedding(text);
  }
}

/** Simple local embedding fallback using character n-gram hashing */
function localEmbedding(text: string, dimensions = 1536): number[] {
  const vector = new Array(dimensions).fill(0);
  const normalized = text.toLowerCase();

  for (let i = 0; i < normalized.length - 2; i++) {
    const trigram = normalized.slice(i, i + 3);
    let hash = 0;
    for (let j = 0; j < trigram.length; j++) {
      hash = (hash * 31 + trigram.charCodeAt(j)) % dimensions;
    }
    vector[hash] += 1;
  }

  const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0)) || 1;
  return vector.map((v) => v / magnitude);
}

/** Find related notes based on content similarity */
export async function findRelatedNotes(
  content: string,
  existingNotes: { id: string; title: string; content: string }[]
): Promise<{ id: string; reason: string }[]> {
  if (existingNotes.length === 0) return [];

  const apiKey = getApiKey();
  if (!apiKey) {
    return keywordRelated(content, existingNotes);
  }

  const notesList = existingNotes
    .map((n) => `- ID: ${n.id}, Title: ${n.title}`)
    .join("\n");

  const result = await chatCompletion(
    "You are a knowledge management assistant. Given a note and a list of existing notes, identify the most related notes. Return ONLY a JSON array of objects with 'id' and 'reason' fields. Max 5 results.",
    `Current note:\n${content.slice(0, 1000)}\n\nExisting notes:\n${notesList}`
  );

  try {
    const parsed = JSON.parse(result);
    if (Array.isArray(parsed)) {
      return parsed.slice(0, 5);
    }
  } catch {
    return keywordRelated(content, existingNotes);
  }

  return keywordRelated(content, existingNotes);
}

function keywordRelated(
  content: string,
  notes: { id: string; title: string; content: string }[]
): { id: string; reason: string }[] {
  const words = new Set(
    content
      .toLowerCase()
      .split(/\W+/)
      .filter((w) => w.length > 3)
  );

  return notes
    .map((note) => {
      const noteWords = note.content
        .toLowerCase()
        .split(/\W+/)
        .filter((w) => w.length > 3);
      const overlap = noteWords.filter((w) => words.has(w)).length;
      return { id: note.id, reason: `关键词匹配 (${overlap} 个)`, score: overlap };
    })
    .filter((n) => n.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(({ id, reason }) => ({ id, reason }));
}