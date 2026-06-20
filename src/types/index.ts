export interface NoteWithMeta {
  id: string;
  title: string;
  content: string;
  summary: string | null;
  tags: string[];
  published: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SearchResult {
  id: string;
  title: string;
  content: string;
  summary: string | null;
  tags: string[];
  similarity: number;
}

export interface RecommendedNote {
  id: string;
  title: string;
  summary: string | null;
  tags: string[];
  similarity: number;
}

export interface GraphNode {
  id: string;
  label: string;
  tags: string[];
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  strength: number;
}