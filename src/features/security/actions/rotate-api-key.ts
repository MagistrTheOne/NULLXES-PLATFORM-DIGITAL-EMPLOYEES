"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { apiKey } from "@/entities/api-key/schema";
import { requireAuth } from "@/features/auth/services/require-auth";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import { planAllowsApiAccess } from "@/features/billing/lib/plan-capabilities";
import { resolveBillingPlanId } from "@/features/billing/lib/resolve-billing-plan";
import {
  inferApiScopeBundle,
  type ApiScopeBundleId,
} from "@/features/public-api/lib/api-scopes";
import { db } from "@/shared/db/client";
import {
  assertTwoFactorForSensitiveAction,
  TwoFactorRequiredError,
} from "../services/assert-two-factor-for-sensitive-action";
import { createApiKey } from "../services/api-key";
import { recordAuditEvent } from "../services/record-audit-event";

/**
 * Issue a replacement key with the same scopes. Previous key stays valid
 * until the owner revokes it (rotate → switch integrations → revoke).
 */
export async function rotateApiKeyAction(input: {
  keyId: string;
}): Promise<
  | {
      ok: true;
      rawKey: string;
      newKeyId: string;
      previousKeyId: string;
      previousKeyName: string;
      scopeBundle: ApiScopeBundleId;
    }
  | { ok: false; message: string }
> {
  const session = await requireAuth();
  const workspace = await ensureWorkspace(session.user.id, session.user.name);

  if (!workspace.permissions.canManageOrganization) {
    return {
      ok: false,
      message: "Only organization owners can rotate API keys.",
    };
  }

  const [existing] = await db
    .select({
      id: apiKey.id,
      name: apiKey.name,
      scopes: apiKey.scopes,
    })
    .from(apiKey)
    .where(
      and(
        eq(apiKey.id, input.keyId),
        eq(apiKey.organizationId, workspace.organization.id),
        isNull(apiKey.revokedAt),
      ),
    )
    .limit(1);

  if (!existing) {
    return { ok: false, message: "API key not found or already revoked." };
  }

  const scopeBundle = inferApiScopeBundle(existing.scopes ?? []);
  const billingPlan = resolveBillingPlanId(workspace.organization.billingPlan);
  const requiredAccess = scopeBundle === "readOnly" ? "read" : "full";
  if (!planAllowsApiAccess(billingPlan, requiredAccess)) {
    return {
      ok: false,
      message:
        "Your plan no longer allows this key's scopes. Upgrade or create a Read-only key.",
    };
  }

  try {
    await assertTwoFactorForSensitiveAction({
      userId: session.user.id,
      role: workspace.membership.role,
      organizationId: workspace.organization.id,
    });
  } catch (error: unknown) {
    if (error instanceof TwoFactorRequiredError) {
      return { ok: false, message: error.message };
    }
    throw error;
  }

  const rotatedName = existing.name.endsWith(" (rotated)")
    ? existing.name
    : `${existing.name} (rotated)`;

  const result = await createApiKey({
    organizationId: workspace.organization.id,
    name: rotatedName,
    createdByUserId: session.user.id,
    scopeBundle,
  });

  if (!result.ok) {
    return result;
  }

  recordAuditEvent({
    organizationId: workspace.organization.id,
    actorUserId: session.user.id,
    actorRole: workspace.membership.role,
    action: "api_key.created",
    resourceType: "api_key",
    resourceId: result.keyId,
    metadata: {
      rotatedFromKeyId: existing.id,
      scopeBundle,
    },
  });

  revalidatePath("/settings");
  return {
    ok: true,
    rawKey: result.rawKey,
    newKeyId: result.keyId,
    previousKeyId: existing.id,
    previousKeyName: existing.name,
    scopeBundle,
  };
}
