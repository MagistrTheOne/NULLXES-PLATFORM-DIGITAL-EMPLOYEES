import type { KnowledgeSourceStatus } from "@/entities/knowledge";

const ALLOWED_TRANSITIONS: Record<
  KnowledgeSourceStatus,
  KnowledgeSourceStatus[]
> = {
  pending: ["processing"],
  processing: ["ready", "failed"],
  ready: [],
  failed: [],
};

export function assertKnowledgeStatusTransition(
  current: KnowledgeSourceStatus,
  next: KnowledgeSourceStatus,
): void {
  const allowed = ALLOWED_TRANSITIONS[current];

  if (!allowed.includes(next)) {
    throw new Error(
      `Invalid knowledge source status transition: ${current} -> ${next}`,
    );
  }
}
