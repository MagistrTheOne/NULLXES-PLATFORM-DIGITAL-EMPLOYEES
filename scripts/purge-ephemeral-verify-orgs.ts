/**
 * Delete organizations created by verify/probe scripts, then orphan verify users.
 *
 * Usage:
 *   npx tsx --env-file=.env -r ./scripts/mock-server-only.cjs scripts/purge-ephemeral-verify-orgs.ts
 *   npx tsx --env-file=.env -r ./scripts/mock-server-only.cjs scripts/purge-ephemeral-verify-orgs.ts --execute
 */
import { inArray } from "drizzle-orm";
import { membership } from "@/entities/membership/schema";
import { organization } from "@/entities/organization/schema";
import { user } from "@/entities/user/schema";
import { isEphemeralVerifyOrganizationName } from "@/features/admin/lib/is-ephemeral-verify-organization";
import { loadEnvFiles } from "@/shared/config/load-env-files";
import { db } from "@/shared/db/client";

loadEnvFiles();

const execute = process.argv.includes("--execute");

function isEphemeralVerifyUser(name: string, email: string): boolean {
  return (
    /\bverify\b/i.test(name) ||
    /\bprobe\b/i.test(name) ||
    /\bverify\b/i.test(email) ||
    /\bprobe\b/i.test(email)
  );
}

async function main(): Promise<void> {
  const rows = await db
    .select({
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      billingPlan: organization.billingPlan,
      createdAt: organization.createdAt,
    })
    .from(organization);

  const junk = rows.filter((row) => isEphemeralVerifyOrganizationName(row.name));
  const keep = rows.filter((row) => !isEphemeralVerifyOrganizationName(row.name));

  console.log(`Total orgs: ${rows.length}`);
  console.log(`Ephemeral (junk): ${junk.length}`);
  console.log(`Keep: ${keep.length}`);
  console.log("");

  if (junk.length > 0) {
    console.log("Will delete orgs:");
    for (const row of junk) {
      console.log(`- ${row.name} (${row.id}) plan=${row.billingPlan}`);
    }
  }

  console.log("");
  console.log("Keeping orgs:");
  for (const row of keep) {
    console.log(`- ${row.name} (${row.id}) plan=${row.billingPlan}`);
  }

  if (!execute) {
    console.log("\nDry run. Re-run with --execute to delete.");
    return;
  }

  if (junk.length > 0) {
    const ids = junk.map((row) => row.id);
    const deleted = await db
      .delete(organization)
      .where(inArray(organization.id, ids))
      .returning({ id: organization.id, name: organization.name });
    console.log(`\nDeleted ${deleted.length} organizations.`);
  }

  const memberedUserIds = await db
    .selectDistinct({ userId: membership.userId })
    .from(membership);
  const memberedSet = new Set(memberedUserIds.map((row) => row.userId));

  const allUsers = await db
    .select({ id: user.id, name: user.name, email: user.email })
    .from(user);

  const orphanVerifyUsers = allUsers.filter(
    (row) =>
      !memberedSet.has(row.id) && isEphemeralVerifyUser(row.name, row.email),
  );

  if (orphanVerifyUsers.length === 0) {
    console.log("No orphan verify users to delete.");
    return;
  }

  console.log(`\nDeleting ${orphanVerifyUsers.length} orphan verify users:`);
  for (const row of orphanVerifyUsers) {
    console.log(`- ${row.name} <${row.email}>`);
  }

  const deletedUsers = await db
    .delete(user)
    .where(
      inArray(
        user.id,
        orphanVerifyUsers.map((row) => row.id),
      ),
    )
    .returning({ id: user.id, email: user.email });

  console.log(`Deleted ${deletedUsers.length} users.`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
