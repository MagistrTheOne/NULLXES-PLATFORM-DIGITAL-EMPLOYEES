import { count, eq, max } from "drizzle-orm";
import { employeeSession } from "@/entities/session/schema";
import { employeeSessionMessage } from "@/entities/session-message/schema";
import { withTenantContext } from "@/shared/db/with-tenant-context";
import { db } from "@/shared/db/client";

export async function appendSessionMessage(input: {
  sessionId: string;
  organizationId: string;
  userId: string;
  role: "user" | "assistant" | "system";
  content: string;
  streamMessageId?: string;
}): Promise<void> {
  await withTenantContext(input.organizationId, async (tx) => {
    const session = await tx.query.employeeSession.findFirst({
      where: eq(employeeSession.id, input.sessionId),
      with: { employee: true },
    });

    if (!session?.employee) {
      throw new Error("Session not found");
    }

    if (session.organizationId !== input.organizationId) {
      throw new Error("Session access denied");
    }

    if (session.userId !== input.userId) {
      throw new Error("Session access denied");
    }

    if (input.streamMessageId) {
      const existing = await tx.query.employeeSessionMessage.findFirst({
        where: eq(
          employeeSessionMessage.streamMessageId,
          input.streamMessageId,
        ),
      });

      if (existing) {
        return;
      }
    }

    const [sequenceRow] = await tx
      .select({ value: max(employeeSessionMessage.sequence) })
      .from(employeeSessionMessage)
      .where(eq(employeeSessionMessage.sessionId, input.sessionId));

    const nextSequence = (sequenceRow?.value ?? -1) + 1;

    await tx.insert(employeeSessionMessage).values({
      sessionId: input.sessionId,
      role: input.role,
      content: input.content.trim(),
      sequence: nextSequence,
      streamMessageId: input.streamMessageId,
    });

    const [messageCountRow] = await tx
      .select({ total: count() })
      .from(employeeSessionMessage)
      .where(eq(employeeSessionMessage.sessionId, input.sessionId));

    await tx
      .update(employeeSession)
      .set({ messageCount: Number(messageCountRow?.total ?? 0) })
      .where(eq(employeeSession.id, input.sessionId));
  });
}

export async function getSessionTranscript(sessionId: string): Promise<
  Array<{
    role: "user" | "assistant" | "system";
    content: string;
  }>
> {
  const rows = await db
    .select({
      role: employeeSessionMessage.role,
      content: employeeSessionMessage.content,
    })
    .from(employeeSessionMessage)
    .where(eq(employeeSessionMessage.sessionId, sessionId))
    .orderBy(employeeSessionMessage.sequence);

  return rows;
}
