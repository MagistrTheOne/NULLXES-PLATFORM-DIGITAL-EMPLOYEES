import { and, eq } from "drizzle-orm";
import {
  integrationConnection,
  type integrationProviderEnum,
} from "@/entities/integration-connection/schema";
import { encryptIntegrationConnectionTokens } from "@/features/integrations/lib/encrypted-tokens";
import { db } from "@/shared/db/client";

type IntegrationProvider = (typeof integrationProviderEnum.enumValues)[number];

export async function upsertIntegrationConnection(input: {
  organizationId: string;
  provider: IntegrationProvider;
  externalAccountId?: string | null;
  accessToken?: string | null;
  refreshToken?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const encrypted = encryptIntegrationConnectionTokens({
    accessToken: input.accessToken,
    refreshToken: input.refreshToken,
  });

  const [existing] = await db
    .select({ id: integrationConnection.id })
    .from(integrationConnection)
    .where(
      and(
        eq(integrationConnection.organizationId, input.organizationId),
        eq(integrationConnection.provider, input.provider),
      ),
    )
    .limit(1);

  const now = new Date();

  if (existing) {
    await db
      .update(integrationConnection)
      .set({
        status: "connected",
        externalAccountId: input.externalAccountId ?? null,
        accessToken: encrypted.accessToken,
        refreshToken: encrypted.refreshToken,
        metadata: input.metadata ?? null,
        connectedAt: now,
        updatedAt: now,
      })
      .where(eq(integrationConnection.id, existing.id));
    return;
  }

  await db.insert(integrationConnection).values({
    organizationId: input.organizationId,
    provider: input.provider,
    status: "connected",
    externalAccountId: input.externalAccountId ?? null,
    accessToken: encrypted.accessToken,
    refreshToken: encrypted.refreshToken,
    metadata: input.metadata ?? null,
    connectedAt: now,
    updatedAt: now,
  });
}

export async function disconnectIntegrationConnection(input: {
  organizationId: string;
  provider: IntegrationProvider;
}): Promise<void> {
  await db
    .update(integrationConnection)
    .set({
      status: "disconnected",
      accessToken: null,
      refreshToken: null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(integrationConnection.organizationId, input.organizationId),
        eq(integrationConnection.provider, input.provider),
      ),
    );
}
