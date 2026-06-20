import { prisma } from "@/lib/prisma";
import { semanticSearch } from "@/lib/embeddings";

export interface HybridSearchItem {
  id: string;
  title: string;
  content: string;
  summary: string | null;
  tags: string[];
}

export interface ScoredSearchItem extends HybridSearchItem {
  score: number;
}

export interface HybridSearchResult extends HybridSearchItem {
  similarity: number;
}

const SEMANTIC_WEIGHT = 0.6;
const KEYWORD_WEIGHT = 0.4;

/** Min-max normalize scores to [0, 1] */
export function normalizeScoreValues(scores: number[]): number[] {
  if (scores.length === 0) return [];

  const max = Math.max(...scores);
  const min = Math.min(...scores);

  if (max === min) {
    return scores.map(() => 1);
  }

  return scores.map((score) => (score - min) / (max - min));
}

/** Format query for PostgreSQL to_tsquery (space-separated terms joined with &) */
export function formatTsQuery(query: string): string {
  const words = query
    .trim()
    .split(/\s+/)
    .map((word) => word.replace(/[&|!():*'\\]/g, "").trim())
    .filter(Boolean);

  return words.join(" & ");
}

/** Merge semantic and keyword results with weighted combined score */
export function mergeHybridResults(
  semanticResults: ScoredSearchItem[],
  keywordResults: ScoredSearchItem[],
  limit: number,
  semanticWeight = SEMANTIC_WEIGHT,
  keywordWeight = KEYWORD_WEIGHT
): HybridSearchResult[] {
  const semanticNorm = normalizeScoreValues(
    semanticResults.map((result) => result.score)
  );
  const keywordNorm = normalizeScoreValues(
    keywordResults.map((result) => result.score)
  );

  const semanticById = new Map(
    semanticResults.map((result, index) => [
      result.id,
      { item: result, score: semanticNorm[index] ?? 0 },
    ])
  );
  const keywordById = new Map(
    keywordResults.map((result, index) => [
      result.id,
      { item: result, score: keywordNorm[index] ?? 0 },
    ])
  );

  const mergedIds = new Set([
    ...semanticById.keys(),
    ...keywordById.keys(),
  ]);

  const merged = [...mergedIds].map((id) => {
    const semantic = semanticById.get(id);
    const keyword = keywordById.get(id);
    const item = semantic?.item ?? keyword!.item;

    const similarity =
      semanticWeight * (semantic?.score ?? 0) +
      keywordWeight * (keyword?.score ?? 0);

    return {
      id: item.id,
      title: item.title,
      content: item.content,
      summary: item.summary,
      tags: item.tags,
      similarity,
    };
  });

  return merged
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}

/** Full-text search using PostgreSQL tsvector/tsquery on title + content */
export async function fullTextSearch(
  userId: string,
  query: string,
  limit = 10
): Promise<ScoredSearchItem[]> {
  const tsQuery = formatTsQuery(query);

  try {
    const results = await prisma.$queryRawUnsafe<
      {
        id: string;
        title: string;
        content: string;
        summary: string | null;
        tags: string[];
        rank: number;
      }[]
    >(
      `WITH search AS (
         SELECT
           plainto_tsquery('simple', $3) AS plain_query,
           CASE
             WHEN $4 <> '' THEN to_tsquery('simple', $4)
             ELSE NULL
           END AS ts_query
       )
       SELECT
         n.id,
         n.title,
         n.content,
         n.summary,
         n.tags,
         GREATEST(
           ts_rank(
             to_tsvector('simple', coalesce(n.title, '') || ' ' || coalesce(n.content, '')),
             s.plain_query
           ),
           COALESCE(
             ts_rank(
               to_tsvector('simple', coalesce(n.title, '') || ' ' || coalesce(n.content, '')),
               s.ts_query
             ),
             0
           )
         ) AS rank
       FROM "Note" n
       CROSS JOIN search s
       WHERE n."userId" = $1
         AND (
           to_tsvector('simple', coalesce(n.title, '') || ' ' || coalesce(n.content, '')) @@ s.plain_query
           OR (
             s.ts_query IS NOT NULL
             AND to_tsvector('simple', coalesce(n.title, '') || ' ' || coalesce(n.content, '')) @@ s.ts_query
           )
         )
       ORDER BY rank DESC
       LIMIT $2`,
      userId,
      limit,
      query,
      tsQuery
    );

    return results.map((result) => ({
      id: result.id,
      title: result.title,
      content: result.content,
      summary: result.summary,
      tags: result.tags,
      score: Number(result.rank),
    }));
  } catch (error) {
    console.error("Full-text search failed:", error);
    return [];
  }
}

/** Hybrid search: semantic + full-text in parallel, merged by note id */
export async function hybridSearch(
  userId: string,
  query: string,
  limit = 10
): Promise<HybridSearchResult[]> {
  const [semanticResults, keywordResults] = await Promise.all([
    semanticSearch(userId, query, limit),
    fullTextSearch(userId, query, limit),
  ]);

  return mergeHybridResults(
    semanticResults.map((result) => ({
      id: result.id,
      title: result.title,
      content: result.content,
      summary: result.summary,
      tags: result.tags,
      score: result.similarity,
    })),
    keywordResults,
    limit
  );
}