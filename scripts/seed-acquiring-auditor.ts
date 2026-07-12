/**
 * Create or update the acquiring auditor login (idempotent).
 *
 * Usage:
 *   ACQUIRING_AUDITOR_PASSWORD='…' npm run auth:seed-acquiring
 *
 * Optional:
 *   ACQUIRING_AUDITOR_EMAIL=acquiring@nullxes.com
 *   ACQUIRING_AUDITOR_NAME="Acquiring Auditor"
 *
 * Does not print the password. Does not commit secrets.
 */
import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import { account } from "../src/features/auth/schema";
import { createMembership } from "../src/entities/membership/create-membership";
import { membership } from "../src/entities/membership/schema";
import { createOrganization } from "../src/entities/organization/create-organization";
import { ensureOrganizationSettings } from "../src/entities/organization-settings";
import { user } from "../src/entities/user/schema";
import { loadEnvFiles } from "../src/shared/config/load-env-files";
import { db } from "../src/shared/db/client";

loadEnvFiles();

const EMAIL =
  process.env.ACQUIRING_AUDITOR_EMAIL?.trim().toLowerCase() ||
  "acquiring@nullxes.com";
const NAME =
  process.env.ACQUIRING_AUDITOR_NAME?.trim() || "Acquiring Auditor";
const PASSWORD = process.env.ACQUIRING_AUDITOR_PASSWORD?.trim();

async function ensureAuditorWorkspace(userId: string): Promise<void> {
  const [membershipRow] = await db
    .select({ id: membership.id })
    .from(membership)
    .where(eq(membership.userId, userId))
    .limit(1);

  if (membershipRow) {
    console.log("Auditor already has a workspace membership.");
    return;
  }

  const org = await createOrganization({
    name: "NULLXES Acquiring Audit",
    slug: `acquiring-audit-${Date.now()}`,
    type: "enterprise",
    status: "active",
  });

  await createMembership({
    userId,
    organizationId: org.id,
    role: "viewer",
  });

  await ensureOrganizationSettings(org.id);
  console.log(`Provisioned acquiring audit workspace: ${org.id}`);
}

async function main(): Promise<void> {
  if (!PASSWORD || PASSWORD.length < 8) {
    throw new Error(
      "Set ACQUIRING_AUDITOR_PASSWORD (min 8 chars). Password is never logged.",
    );
  }

  const passwordHash = await hashPassword(PASSWORD);

  const [existing] = await db
    .select({ id: user.id, email: user.email })
    .from(user)
    .where(eq(user.email, EMAIL))
    .limit(1);

  let userId = existing?.id;

  if (userId) {
    await db
      .update(user)
      .set({
        name: NAME,
        emailVerified: true,
        status: "active",
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId));

    const [cred] = await db
      .select({ id: account.id })
      .from(account)
      .where(
        and(eq(account.userId, userId), eq(account.providerId, "credential")),
      )
      .limit(1);

    if (cred) {
      await db
        .update(account)
        .set({
          password: passwordHash,
          updatedAt: new Date(),
        })
        .where(eq(account.id, cred.id));
    } else {
      await db.insert(account).values({
        id: randomUUID(),
        accountId: userId,
        providerId: "credential",
        userId,
        password: passwordHash,
      });
    }

    console.log(`Updated auditor login: ${EMAIL}`);
  } else {
    userId = randomUUID();
    await db.insert(user).values({
      id: userId,
      name: NAME,
      email: EMAIL,
      emailVerified: true,
      status: "active",
    });
    await db.insert(account).values({
      id: randomUUID(),
      accountId: userId,
      providerId: "credential",
      userId,
      password: passwordHash,
    });
    console.log(`Created auditor login: ${EMAIL}`);
  }

  await ensureAuditorWorkspace(userId);
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
