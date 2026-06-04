import { relations } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { knowledgeChunk, knowledgeSource } from "./schema";

export const knowledgeSourceRelations = relations(
  knowledgeSource,
  ({ one, many }) => ({
    employee: one(digitalEmployee, {
      fields: [knowledgeSource.employeeId],
      references: [digitalEmployee.id],
    }),
    chunks: many(knowledgeChunk),
  }),
);

export const knowledgeChunkRelations = relations(knowledgeChunk, ({ one }) => ({
  source: one(knowledgeSource, {
    fields: [knowledgeChunk.sourceId],
    references: [knowledgeSource.id],
  }),
}));
