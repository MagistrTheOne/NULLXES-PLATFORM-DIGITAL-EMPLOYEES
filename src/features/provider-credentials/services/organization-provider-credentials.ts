import { and, eq } from "drizzle-orm";
import {
  organizationProviderCredential,
  type OrganizationProvider,
} from "@/entities/organization-provider-credential";
import {
  getAnthropicApiKey,
  getGoogleApiKey,
  getOpenAiApiKey,
} from "@/shared/config/provider-env";
import { decryptField, encryptField } from "@/shared/crypto/field-encryption";
import { db } from "@/shared/db/client";

export type ProviderKeyStatus = {
  provider: OrganizationProvider;
  source: "organization" | "platform" | "none";
  last4: string | null;
  updatedAt: Date | null;
};

function platformKeyForProvider(
  provider: OrganizationProvider,
): string | undefined {
  switch (provider) {
    case "openai":
      return getOpenAiApiKey();
    case "anthropic":
      return getAnthropicApiKey();
    case "google":
      return getGoogleApiKey();
    default:
      return undefined;
  }
}

export async function resolveOrganizationProviderKey(
  organizationId: string | undefined,
  provider: OrganizationProvider,
): Promise<string | undefined> {
  if (organizationId) {
    const [row] = await db
      .select({ encryptedKey: organizationProviderCredential.encryptedKey })
      .from(organizationProviderCredential)
      .where(
        and(
          eq(organizationProviderCredential.organizationId, organizationId),
          eq(organizationProviderCredential.provider, provider),
        ),
      )
      .limit(1);

    const decrypted = decryptField(row?.encryptedKey)?.trim();
    if (decrypted) {
      return decrypted;
    }
  }

  return platformKeyForProvider(provider);
}

export async function listOrganizationProviderKeyStatuses(
  organizationId: string,
): Promise<ProviderKeyStatus[]> {
  const rows = await db
    .select({
      provider: organizationProviderCredential.provider,
      last4: organizationProviderCredential.last4,
      updatedAt: organizationProviderCredential.updatedAt,
    })
    .from(organizationProviderCredential)
    .where(eq(organizationProviderCredential.organizationId, organizationId));

  const byProvider = new Map(rows.map((row) => [row.provider, row]));
  const providers: OrganizationProvider[] = ["openai", "anthropic", "google"];

  return providers.map((provider) => {
    const row = byProvider.get(provider);
    if (row) {
      return {
        provider,
        source: "organization",
        last4: row.last4,
        updatedAt: row.updatedAt,
      };
    }

    return {
      provider,
      source: platformKeyForProvider(provider) ? "platform" : "none",
      last4: null,
      updatedAt: null,
    };
  });
}

export async function setOrganizationProviderKey(input: {
  organizationId: string;
  provider: OrganizationProvider;
  apiKey: string;
  createdByUserId: string;
}): Promise<void> {
  const apiKey = input.apiKey.trim();
  const encryptedKey = encryptField(apiKey);
  if (!encryptedKey) {
    throw new Error("API key is empty");
  }

  const last4 = apiKey.slice(-4);

  await db
    .insert(organizationProviderCredential)
    .values({
      organizationId: input.organizationId,
      provider: input.provider,
      encryptedKey,
      last4,
      createdByUserId: input.createdByUserId,
    })
    .onConflictDoUpdate({
      target: [
        organizationProviderCredential.organizationId,
        organizationProviderCredential.provider,
      ],
      set: {
        encryptedKey,
        last4,
        createdByUserId: input.createdByUserId,
        updatedAt: new Date(),
      },
    });
}

export async function removeOrganizationProviderKey(input: {
  organizationId: string;
  provider: OrganizationProvider;
}): Promise<void> {
  await db
    .delete(organizationProviderCredential)
    .where(
      and(
        eq(organizationProviderCredential.organizationId, input.organizationId),
        eq(organizationProviderCredential.provider, input.provider),
      ),
    );
}
