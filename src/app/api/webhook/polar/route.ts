import { Webhooks } from "@polar-sh/nextjs";
import { eq } from "drizzle-orm";
import { organization } from "@/entities/organization/schema";
import { syncOrganizationBillingFromPolarEvent } from "@/features/billing/services/sync-organization-polar-billing";
import { getPolarWebhookSecret } from "@/features/billing/services/polar-config";
import { db } from "@/shared/db/client";

const webhookSecret = getPolarWebhookSecret();

export const POST = webhookSecret
  ? Webhooks({
      webhookSecret,
      onSubscriptionActive: async (payload) => {
        const externalId = payload.data.customer?.externalId;
        if (!externalId) {
          return;
        }

        await syncOrganizationBillingFromPolarEvent({
          externalId,
          customerId: payload.data.customer?.id,
          productId: payload.data.productId,
        });
      },
      onSubscriptionCanceled: async (payload) => {
        const externalId = payload.data.customer?.externalId;
        if (!externalId) {
          return;
        }

        await syncOrganizationBillingFromPolarEvent({
          externalId,
          customerId: payload.data.customer?.id,
          fallbackPlan: "free",
        });
      },
      onOrderPaid: async (payload) => {
        const externalId = payload.data.customer?.externalId;
        if (!externalId) {
          return;
        }

        await syncOrganizationBillingFromPolarEvent({
          externalId,
          customerId: payload.data.customer?.id,
          productId: payload.data.productId,
        });
      },
      onCustomerCreated: async (payload) => {
        const externalId = payload.data.externalId;
        if (!externalId) {
          return;
        }

        await db
          .update(organization)
          .set({ polarCustomerId: payload.data.id })
          .where(eq(organization.id, externalId));
      },
    })
  : async () =>
      new Response(JSON.stringify({ error: "Polar webhook not configured" }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      });
