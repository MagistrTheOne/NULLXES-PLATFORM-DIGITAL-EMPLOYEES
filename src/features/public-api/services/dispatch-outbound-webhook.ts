import { eq } from "drizzle-orm";
import { organizationSettings } from "@/entities/organization-settings/schema";
import { db } from "@/shared/db/client";
import { decryptField } from "@/shared/crypto/field-encryption";
import { assertSafeOutboundUrlResolved } from "@/shared/security/assert-safe-outbound-url";
import { signOutboundWebhookPayload } from "../lib/sign-outbound-webhook";

export async function dispatchOrganizationWebhook(input: {
  organizationId: string;
  event: string;
  data: Record<string, unknown>;
}): Promise<{ delivered: boolean; status?: number }> {
  const [settings] = await db
    .select({
      url: organizationSettings.outboundWebhookUrl,
      secret: organizationSettings.outboundWebhookSecret,
    })
    .from(organizationSettings)
    .where(eq(organizationSettings.organizationId, input.organizationId))
    .limit(1);

  if (!settings?.url?.trim()) {
    return { delivered: false };
  }

  let safeUrl: URL;
  try {
    safeUrl = await assertSafeOutboundUrlResolved(settings.url);
  } catch {
    return { delivered: false };
  }

  const timestamp = String(Math.floor(Date.now() / 1000));
  const body = JSON.stringify({
    event: input.event,
    created_at: new Date().toISOString(),
    data: input.data,
  });
  const secret = decryptField(settings.secret)?.trim() ?? "";
  const signature = secret
    ? signOutboundWebhookPayload({ secret, timestamp, body })
    : "";

  const response = await fetch(safeUrl.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "NULLXES-Webhooks/1.0",
      "X-NULLXES-Event": input.event,
      "X-NULLXES-Timestamp": timestamp,
      ...(signature ? { "X-NULLXES-Signature": signature } : {}),
    },
    body,
    redirect: "error",
  });

  return {
    delivered: response.ok,
    status: response.status,
  };
}
