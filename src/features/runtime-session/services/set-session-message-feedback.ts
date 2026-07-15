import { and, eq } from "drizzle-orm";
import { employeeSession } from "@/entities/session/schema";
import { employeeSessionMessage } from "@/entities/session-message/schema";
import { db } from "@/shared/db/client";

export type SessionMessageFeedback = "up" | "down";

export async function setSessionMessageFeedback(input: {
  streamMessageId: string;
  organizationId: string;
  userId: string;
  feedback: SessionMessageFeedback | null;
}): Promise<void> {
  const streamMessageId = input.streamMessageId.trim();
  if (!streamMessageId) {
    throw new Error("Message id is required");
  }

  const [row] = await db
    .select({
      messageId: employeeSessionMessage.id,
      sessionUserId: employeeSession.userId,
      organizationId: employeeSession.organizationId,
    })
    .from(employeeSessionMessage)
    .innerJoin(
      employeeSession,
      eq(employeeSessionMessage.sessionId, employeeSession.id),
    )
    .where(
      and(
        eq(employeeSessionMessage.streamMessageId, streamMessageId),
        eq(employeeSessionMessage.role, "assistant"),
      ),
    )
    .limit(1);

  if (!row) {
    throw new Error("Message not found");
  }

  if (row.organizationId !== input.organizationId) {
    throw new Error("Message access denied");
  }

  if (row.sessionUserId !== input.userId) {
    throw new Error("Message access denied");
  }

  await db
    .update(employeeSessionMessage)
    .set({ feedback: input.feedback })
    .where(eq(employeeSessionMessage.id, row.messageId));
}
