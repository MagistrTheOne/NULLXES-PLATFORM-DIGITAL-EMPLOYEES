"use server";

import { eq } from "drizzle-orm";
import { requireAuth } from "@/features/auth/services/require-auth";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import { resolveWorkspacePermissions } from "@/features/workspace/services/resolve-workspace-permissions";
import { organization } from "@/entities/organization/schema";
import { db } from "@/shared/db/client";
import { getBetterAuthUrl } from "@/shared/config/env";
import { getStripeClient } from "../services/stripe-client";

export async function createBillingPortalSessionAction(): Promise<
  { ok: true; url: string } | { ok: false; message: string }
> {
  const session = await requireAuth();
  const workspace = await ensureWorkspace(session.user.id, session.user.name);
  const permissions = resolveWorkspacePermissions(workspace.membership.role);

  if (!permissions.canManageOrganization) {
    return { ok: false, message: "Only organization owners can manage billing." };
  }

  const stripe = getStripeClient();
  if (!stripe) {
    return { ok: false, message: "Stripe is not configured. Set STRIPE_SECRET_KEY." };
  }

  let customerId = workspace.organization.stripeCustomerId ?? null;

  if (!customerId) {
    const customer = await stripe.customers.create({
      name: workspace.organization.name,
      metadata: { organizationId: workspace.organization.id },
    });
    customerId = customer.id;

    await db
      .update(organization)
      .set({ stripeCustomerId: customerId })
      .where(eq(organization.id, workspace.organization.id));
  }

  const portal = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${getBetterAuthUrl()}/settings`,
  });

  return { ok: true, url: portal.url };
}
