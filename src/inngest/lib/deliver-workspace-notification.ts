import { and, eq, inArray } from "drizzle-orm";
import { ensureOrganizationSettings } from "@/entities/organization-settings";
import { membership } from "@/entities/membership/schema";
import { user } from "@/entities/user/schema";
import { db } from "@/shared/db/client";
import { sendNotificationEmail } from "@/shared/email/send-notification-email";

export type WorkspaceNotificationKind =
  | "notifySessionCompleted"
  | "notifyEmployeeCreated"
  | "notifyKnowledgeFailed"
  | "notifyWeeklyDigest";

export async function getWorkspaceAdminEmails(
  organizationId: string,
): Promise<string[]> {
  const rows = await db
    .select({ email: user.email })
    .from(membership)
    .innerJoin(user, eq(user.id, membership.userId))
    .where(
      and(
        eq(membership.organizationId, organizationId),
        inArray(membership.role, ["owner", "admin"]),
      ),
    );

  return [...new Set(rows.map((row) => row.email).filter(Boolean))];
}

export async function deliverWorkspaceNotification(input: {
  organizationId: string;
  kind: WorkspaceNotificationKind;
  subject: string;
  html: string;
}): Promise<{ notified: boolean; recipientCount: number }> {
  const settings = await ensureOrganizationSettings(input.organizationId);

  if (!settings[input.kind]) {
    return { notified: false, recipientCount: 0 };
  }

  const recipients = await getWorkspaceAdminEmails(input.organizationId);
  const result = await sendNotificationEmail({
    to: recipients,
    subject: input.subject,
    html: input.html,
  });

  return {
    notified: result.sent,
    recipientCount: result.recipientCount,
  };
}
