import { eq, isNotNull } from "drizzle-orm";
import { integrationConnection } from "@/entities/integration-connection/schema";
import { organizationSettings } from "@/entities/organization-settings/schema";
import { exportJob } from "@/entities/export-job/schema";
import {
  encryptField,
  isEncryptedFieldValue,
} from "@/shared/crypto/field-encryption";
import { db } from "@/shared/db/client";
import { encryptIntegrationToken } from "@/features/integrations/lib/encrypted-tokens";

async function migrateOrganizationWebhookSecrets(): Promise<number> {
  const rows = await db
    .select({
      organizationId: organizationSettings.organizationId,
      secret: organizationSettings.outboundWebhookSecret,
    })
    .from(organizationSettings)
    .where(isNotNull(organizationSettings.outboundWebhookSecret));

  let migrated = 0;

  for (const row of rows) {
    if (!row.secret || isEncryptedFieldValue(row.secret)) {
      continue;
    }

    await db
      .update(organizationSettings)
      .set({
        outboundWebhookSecret: encryptField(row.secret),
        updatedAt: new Date(),
      })
      .where(eq(organizationSettings.organizationId, row.organizationId));

    migrated += 1;
  }

  return migrated;
}

async function migrateExportJobTokens(): Promise<number> {
  const rows = await db
    .select({
      id: exportJob.id,
      downloadToken: exportJob.downloadToken,
    })
    .from(exportJob)
    .where(isNotNull(exportJob.downloadToken));

  let migrated = 0;

  for (const row of rows) {
    if (!row.downloadToken || isEncryptedFieldValue(row.downloadToken)) {
      continue;
    }

    await db
      .update(exportJob)
      .set({ downloadToken: encryptField(row.downloadToken) })
      .where(eq(exportJob.id, row.id));

    migrated += 1;
  }

  return migrated;
}

async function migrateIntegrationTokens(): Promise<number> {
  const rows = await db.select().from(integrationConnection);
  let migrated = 0;

  for (const row of rows) {
    const accessToken = encryptIntegrationToken(row.accessToken);
    const refreshToken = encryptIntegrationToken(row.refreshToken);

    if (
      accessToken === row.accessToken &&
      refreshToken === row.refreshToken
    ) {
      continue;
    }

    await db
      .update(integrationConnection)
      .set({
        accessToken,
        refreshToken,
        updatedAt: new Date(),
      })
      .where(eq(integrationConnection.id, row.id));

    migrated += 1;
  }

  return migrated;
}

async function main(): Promise<void> {
  const [webhooks, exportTokens, integrations] = await Promise.all([
    migrateOrganizationWebhookSecrets(),
    migrateExportJobTokens(),
    migrateIntegrationTokens(),
  ]);

  console.log("Secret encryption migration complete.");
  console.log(`Webhook secrets migrated: ${webhooks}`);
  console.log(`Export download tokens migrated: ${exportTokens}`);
  console.log(`Integration connections migrated: ${integrations}`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error("Migration failed:", message);
  process.exit(1);
});
