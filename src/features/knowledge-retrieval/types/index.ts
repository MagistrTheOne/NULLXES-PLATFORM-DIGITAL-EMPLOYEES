export type KnowledgeSearchResult = {
  chunkId: string;
  sourceId: string;
  sourceTitle: string;
  content: string;
  similarity: number;
};

export type EmbedTextsInput = {
  texts: string[];
};

export type SearchKnowledgeInput = {
  employeeId: string;
  query: string;
  topK?: number;
  useSessionCache?: boolean;
};

export type ChunkAndEmbedSourceInput = {
  sourceId: string;
};
