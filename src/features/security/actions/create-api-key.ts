"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/features/auth/services/require-auth";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import { planAllowsApiAccess } from "@/features/billing/lib/plan-capabilities";
import { resolveBillingPlanId } from "@/features/billing/lib/resolve-billing-plan";
import {
  assertTwoFactorForSensitiveAction,
  TwoFactorRequiredError,
} from "../services/assert-two-factor-for-sensitive-action";
import { recordAuditEvent } from "../services/record-audit-event";
import type { ApiScopeBundleId } from "@/features/public-api/lib/api-scopes";
import { createApiKey } from "../services/api-key";

export async function createApiKeyAction(input: {
  name: string;
  scopeBundle: ApiScopeBundleId;
}): Promise<
  { ok: true; rawKey: string } | { ok: false; message: string }
> {
  const session = await requireAuth();
  const workspace = await ensureWorkspace(session.user.id, session.user.name);

  if (!workspace.permissions.canManageOrganization) {
    return { ok: false, message: "Only organization owners can create API keys." };
  }

  const billingPlan = resolveBillingPlanId(workspace.organization.billingPlan);
  const requiredAccess =
    input.scopeBundle === "readOnly" ? "read" : "full";
  if (!planAllowsApiAccess(billingPlan, requiredAccess)) {
    return {
      ok: false,
      message:
        requiredAccess === "read"
          ? "API read access starts on Operator. Upgrade your plan or contact sales."
          : "Full API access starts on Scale. Upgrade your plan or contact sales.",
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

  const result = await createApiKey({
    organizationId: workspace.organization.id,
    name: input.name,
    createdByUserId: session.user.id,
    scopeBundle: input.scopeBundle,
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
    metadata: { name: input.name.trim(), scopeBundle: input.scopeBundle },
  });

  revalidatePath("/settings");
  return { ok: true, rawKey: result.rawKey };
}
