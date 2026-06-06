import {
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { vector1536 } from "@/shared/db/vector";

export const knowledgeSourceTypeEnum = pgEnum("knowledge_source_type", [
  "file",
  "url",
  "text",
  "session_summary",
]);

export const knowledgeSourceStatusEnum = pgEnum("knowledge_source_status", [
  "pending",
  "processing",
  "ready",
  "failed",
]);

export const knowledgeSource = pgTable("knowledge_source", {
  id: uuid("id").primaryKey().defaultRandom(),
  employeeId: uuid("employee_id")
    .notNull()
    .references(() => digitalEmployee.id, { onDelete: "cascade" }),
  type: knowledgeSourceTypeEnum("type").notNull(),
  title: text("title").notNull(),
  status: knowledgeSourceStatusEnum("status").notNull().default("pending"),
  failureReason: text("failure_reason"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const knowledgeChunk = pgTable("knowledge_chunk", {
  id: uuid("id").primaryKey().defaultRandom(),
  sourceId: uuid("source_id")
    .notNull()
    .references(() => knowledgeSource.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  chunkIndex: integer("chunk_index").notNull(),
  embedding: vector1536("embedding"),
  embeddingModel: text("embedding_model").default("text-embedding-3-small"),
  tokenCount: integer("token_count"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
