/**
 * Re-encrypt field-encrypted columns with the active key ring version.
 *
 * Run after adding a new key to DATA_ENCRYPTION_KEYS (e.g. `v2:<base64>`):
 *
 *   npx tsx scripts/rotate-field-encryption.ts          # dry run
 *   npx tsx scripts/rotate-field-encryption.ts --apply  # re-encrypt rows
 *
 * The old key must stay in the ring until this script reports 0 stale rows;
 * only then may it be removed from the environment.
 */
import { neon } from "@neondatabase/serverless";
import { loadEnvFiles } from "@/shared/config/load-env-files";
import { getDataEncryptionKeyRing } from "@/shared/config/env";
import {
  isStaleEncryptedFieldValue,
  reencryptField,
} from "@/shared/crypto/field-encryption";

loadEnvFiles();

const apply = process.argv.includes("--apply");

const ENCRYPTED_COLUMNS: Array<{ table: string; column: string }> = [
  { table: "organization_provider_credential", column: "encrypted_key" },
  { table: "organization_settings", column: "outbound_webhook_secret" },
  { table: "integration_connection", column: "access_token" },
  { table: "integration_connection", column: "refresh_token" },
  { table: "export_job", column: "download_token" },
  { table: "export_job", column: "payload_path" },
];

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  const ring = getDataEncryptionKeyRing();
  console.log(
    `Key ring: versions [${[...ring.keys.keys()].sort().join(", ")}], active v${ring.activeVersion}`,
  );
  console.log(apply ? "Mode: APPLY" : "Mode: dry run (pass --apply to write)");

  const sql = neon(databaseUrl);
  let totalStale = 0;
  let totalRotated = 0;

  for (const { table, column } of ENCRYPTED_COLUMNS) {
    const rows = (await sql.query(
      `SELECT id, "${column}" AS value FROM "${table}" WHERE "${column}" LIKE 'enc:v%'`,
    )) as Array<{ id: string; value: string }>;

    const stale = rows.filter((row) => isStaleEncryptedFieldValue(row.value));
    totalStale += stale.length;
    console.log(
      `${table}.${column}: ${rows.length} encrypted, ${stale.length} stale`,
    );

    if (!apply) {
      continue;
    }

    for (const row of stale) {
      const rotated = reencryptField(row.value);
      await sql.query(`UPDATE "${table}" SET "${column}" = $1 WHERE id = $2`, [
        rotated,
        row.id,
      ]);
      totalRotated += 1;
    }
  }

  if (apply) {
    console.log(`Done: re-encrypted ${totalRotated} value(s).`);
  } else if (totalStale > 0) {
    console.log(`${totalStale} value(s) need rotation. Re-run with --apply.`);
  } else {
    console.log("All encrypted values already use the active key.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
