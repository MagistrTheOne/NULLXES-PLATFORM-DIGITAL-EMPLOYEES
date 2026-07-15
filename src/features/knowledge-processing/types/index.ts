import type {
  KnowledgeChunk,
  KnowledgeSource,
  KnowledgeSourceStatus,
  KnowledgeSourceType,
} from "@/entities/knowledge";

export type KnowledgeChunkInput = {
  content: string;
  chunkIndex?: number;
};

export type CreateKnowledgeSourceInput = {
  employeeId: string;
  /** Caller workspace — required for catalog home-org writes. */
  organizationId?: string;
  type: KnowledgeSourceType;
  title: string;
  chunks: KnowledgeChunkInput[];
};

export type CreateKnowledgeSourceResult = {
  source: KnowledgeSource;
  chunks: KnowledgeChunk[];
  lifecycleStatus: KnowledgeSourceStatus;
};

export type StartKnowledgeProcessingInput = {
  sourceId: string;
};

export type MarkKnowledgeReadyInput = {
  sourceId: string;
};

export type MarkKnowledgeFailedInput = {
  sourceId: string;
  failureReason: string;
};

export type KnowledgeSourceStatusChangeResult = {
  source: KnowledgeSource;
  previousStatus: KnowledgeSourceStatus;
  nextStatus: KnowledgeSourceStatus;
};
