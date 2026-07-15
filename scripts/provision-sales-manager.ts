/**
 * Provision sales manager on an isolated Holding workspace.
 *
 * - Own organization (NOT CEO org): separate chats, missions, analytics, billing
 * - Plan: government (Holding) → full platform catalog employees for demos
 * - Role: owner → can manage own tariffs
 * - Removes any membership in the CEO organization
 *
 * Usage:
 *   SALES_MANAGER_PASSWORD='…' npm run auth:provision-sales-manager
 *
 * Optional:
 *   SALES_MANAGER_EMAIL=mistery004@gmail.com
 *   SALES_MANAGER_NAME="Sales Manager"
 *   CEO_EMAIL=ceo@nullxes.com
 *
 * Does not print the password.
 */
import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import { account } from "../src/features/auth/schema";
import { createMembership } from "../src/entities/membership/create-membership";
import { membership } from "../src/entities/membership/schema";
import { createOrganization } from "../src/entities/organization/create-organization";
import { organization } from "../src/entities/organization/schema";
import { ensureOrganizationSettings } from "../src/entities/organization-settings";
import { user } from "../src/entities/user/schema";
import { loadEnvFiles } from "../src/shared/config/load-env-files";
import { db } from "../src/shared/db/client";

loadEnvFiles();

const EMAIL =
  process.env.SALES_MANAGER_EMAIL?.trim().toLowerCase() ||
  "mistery004@gmail.com";
const NAME =
  process.env.SALES_MANAGER_NAME?.trim() || "Sales Manager";
const PASSWORD = process.env.SALES_MANAGER_PASSWORD?.trim();
const SALES_ORG_SLUG =
  process.env.SALES_ORG_SLUG?.trim() || "nullxes-sales-demos";

async function upsertCredentialUser(): Promise<string> {
  if (!PASSWORD || PASSWORD.length < 8) {
    throw new Error(
      "Set SALES_MANAGER_PASSWORD (min 8 chars). Password is never logged.",
    );
  }

  const passwordHash = await hashPassword(PASSWORD);

  const [existing] = await db
    .select({ id: user.id })
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

    console.log(`Updated login: ${EMAIL}`);
    return userId;
  }

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
  console.log(`Created login: ${EMAIL}`);
  return userId;
}

async function ensureIsolatedHoldingOrg(userId: string): Promise<{
  id: string;
  name: string;
  slug: string;
}> {
  const [bySlug] = await db
    .select({
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      billingPlan: organization.billingPlan,
    })
    .from(organization)
    .where(eq(organization.slug, SALES_ORG_SLUG))
    .limit(1);

  let org = bySlug;

  if (!org) {
    const created = await createOrganization({
      name: "NULLXES Sales Demos",
      slug: SALES_ORG_SLUG,
      type: "enterprise",
      status: "active",
    });
    await ensureOrganizationSettings(created.id);
    org = {
      id: created.id,
      name: created.name,
      slug: created.slug,
      billingPlan: created.billingPlan,
    };
    console.log(`Created sales org: ${org.name} [${org.id}]`);
  } else {
    console.log(`Using sales org: ${org.name} [${org.id}]`);
  }

  if (org.billingPlan !== "government") {
    await db
      .update(organization)
      .set({ billingPlan: "government", updatedAt: new Date() })
      .where(eq(organization.id, org.id));
    console.log("Sales org plan → government (Holding)");
  }

  const [existingMembership] = await db
    .select({ id: membership.id, role: membership.role })
    .from(membership)
    .where(
      and(
        eq(membership.userId, userId),
        eq(membership.organizationId, org.id),
      ),
    )
    .limit(1);

  if (!existingMembership) {
    await createMembership({
      userId,
      organizationId: org.id,
      role: "owner",
    });
    console.log("Added sales manager as owner of isolated org");
  } else if (existingMembership.role !== "owner") {
    await db
      .update(membership)
      .set({ role: "owner" })
      .where(eq(membership.id, existingMembership.id));
    console.log("Sales membership role → owner");
  }

  return { id: org.id, name: org.name, slug: org.slug };
}

async function detachFromOtherOrgs(
  userId: string,
  salesOrgId: string,
): Promise<void> {
  const rows = await db
    .select({
      id: membership.id,
      orgId: organization.id,
      orgName: organization.name,
      role: membership.role,
    })
    .from(membership)
    .innerJoin(organization, eq(membership.organizationId, organization.id))
    .where(eq(membership.userId, userId));

  for (const row of rows) {
    if (row.orgId === salesOrgId) {
      continue;
    }
    await db.delete(membership).where(eq(membership.id, row.id));
    console.log(
      `Detached from: ${row.orgName} (${row.role}) — chats/missions/billing isolated`,
    );
  }
}

async function main(): Promise<void> {
  const userId = await upsertCredentialUser();
  const salesOrg = await ensureIsolatedHoldingOrg(userId);
  await detachFromOtherOrgs(userId, salesOrg.id);

  console.log(
    "Done. Sales manager has isolated Holding workspace; catalog employees stay visible for demos.",
  );
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
