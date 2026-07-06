"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { membership } from "@/entities/membership/schema";
import { employeeSessionMessage } from "@/entities/session-message/schema";
import { employeeSession } from "@/entities/session/schema";
import { userConsent } from "@/entities/user-consent/schema";
import { user } from "@/entities/user/schema";
import { requireAuth } from "@/features/auth/services/require-auth";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import { db } from "@/shared/db/client";
import {
  PERSONAL_DATA_POLICY_URL,
  PERSONAL_DATA_POLICY_VERSION,
} from "../lib/personal-data-policy";
import { recordUserConsents } from "../services/record-user-consent";

export async function recordPersonalDataConsentAction(input: {
  userId: string;
  organizationId?: string | null;
  acceptedTermsOfService?: boolean;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    await recordUserConsents({
      userId: input.userId,
      organizationId: input.organizationId,
      consentTypes: input.acceptedTermsOfService
        ? ["personal_data_processing", "terms_of_service"]
        : ["personal_data_processing"],
    });
    return { ok: true };
  } catch (error: unknown) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Consent recording failed",
    };
  }
}

export async function exportUserPersonalDataAction(): Promise<
  { ok: true; payload: string } | { ok: false; message: string }
> {
  const session = await requireAuth();
  const userId = session.user.id;

  const [profile] = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      dataRegion: user.dataRegion,
      createdAt: user.createdAt,
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  const consents = await db
    .select({
      consentType: userConsent.consentType,
      policyVersion: userConsent.policyVersion,
      policyUrl: userConsent.policyUrl,
      acceptedAt: userConsent.acceptedAt,
      ipAddress: userConsent.ipAddress,
    })
    .from(userConsent)
    .where(eq(userConsent.userId, userId));

  const sessions = await db
    .select({
      id: employeeSession.id,
      employeeId: employeeSession.employeeId,
      status: employeeSession.status,
      startedAt: employeeSession.startedAt,
      endedAt: employeeSession.endedAt,
      durationSeconds: employeeSession.durationSeconds,
      summary: employeeSession.summary,
      primaryTopic: employeeSession.primaryTopic,
      createdAt: employeeSession.createdAt,
    })
    .from(employeeSession)
    .where(eq(employeeSession.userId, userId));

  const sessionIds = sessions.map((row) => row.id);
  const sessionTranscripts =
    sessionIds.length > 0
      ? await db
          .select({
            sessionId: employeeSessionMessage.sessionId,
            role: employeeSessionMessage.role,
            content: employeeSessionMessage.content,
            createdAt: employeeSessionMessage.createdAt,
          })
          .from(employeeSessionMessage)
          .where(inArray(employeeSessionMessage.sessionId, sessionIds))
      : [];

  return {
    ok: true,
    payload: JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        policy: {
          version: PERSONAL_DATA_POLICY_VERSION,
          url: PERSONAL_DATA_POLICY_URL,
        },
        profile: profile ?? null,
        consents,
        sessions,
        sessionTranscripts,
      },
      null,
      2,
    ),
  };
}

export async function deleteUserAccountAction(): Promise<
  { ok: true } | { ok: false; message: string }
> {
  const session = await requireAuth();
  const workspace = await ensureWorkspace(session.user.id, session.user.name);

  const owners = await db
    .select({ userId: membership.userId })
    .from(membership)
    .where(
      and(
        eq(membership.organizationId, workspace.organization.id),
        eq(membership.role, "owner"),
      ),
    );

  if (owners.length === 1 && owners[0]?.userId === session.user.id) {
    return {
      ok: false,
      message:
        "You are the sole workspace owner. Transfer ownership or delete the workspace before deleting your account.",
    };
  }

  await db.delete(user).where(eq(user.id, session.user.id));

  revalidatePath("/settings");
  return { ok: true };
}
