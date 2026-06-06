import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { agentApprovalRequest, agentApprovalStatusEnum } from "./schema";

export type AgentApprovalRequest = InferSelectModel<typeof agentApprovalRequest>;
export type NewAgentApprovalRequest = InferInsertModel<
  typeof agentApprovalRequest
>;
export type AgentApprovalStatus =
  (typeof agentApprovalStatusEnum.enumValues)[number];
