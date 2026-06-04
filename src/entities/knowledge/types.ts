import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  knowledgeChunk,
  knowledgeSource,
  knowledgeSourceStatusEnum,
  knowledgeSourceTypeEnum,
} from "./schema";

export type KnowledgeSource = InferSelectModel<typeof knowledgeSource>;
export type NewKnowledgeSource = InferInsertModel<typeof knowledgeSource>;
export type KnowledgeChunk = InferSelectModel<typeof knowledgeChunk>;
export type NewKnowledgeChunk = InferInsertModel<typeof knowledgeChunk>;

export type KnowledgeSourceType =
  (typeof knowledgeSourceTypeEnum.enumValues)[number];
export type KnowledgeSourceStatus =
  (typeof knowledgeSourceStatusEnum.enumValues)[number];
