/**
 * Provision sales manager: credential login + Holding org access + CEO workspace membership
 * so demos can use the CEO workforce.
 *
 * Usage:
 *   SALES_MANAGER_PASSWORD='…' npm run auth:provision-sales-manager
 *
 * Optional:
 *   SALES_MANAGER_EMAIL=mistery004@gmail.com
 *   SALES_MANAGER_NAME="Sales Manager"
 *   CEO_EMAIL=ceo@nullxes.com
 *   SALES_MANAGER_ROLE=operator
 *
 * Does not print the password.
 */
import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import { account } from "../src/features/auth/schema";
import { createMembership } from "../src/entities/membership/create-membership";
import { membership } from "../src/entities/membership/schema";
import { organization } from "../src/entities/organization/schema";
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
const CEO_EMAIL =
  process.env.CEO_EMAIL?.trim().toLowerCase() || "ceo@nullxes.com";
const ROLE = (process.env.SALES_MANAGER_ROLE?.trim() || "operator") as
  | "owner"
  | "admin"
  | "operator"
  | "viewer";

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

async function resolveCeoOrganizationId(): Promise<{
  id: string;
  name: string;
  slug: string;
  billingPlan: string;
}> {
  const [row] = await db
    .select({
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      billingPlan: organization.billingPlan,
    })
    .from(membership)
    .innerJoin(user, eq(membership.userId, user.id))
    .innerJoin(organization, eq(membership.organizationId, organization.id))
    .where(and(eq(user.email, CEO_EMAIL), eq(membership.role, "owner")))
    .limit(1);

  if (row) {
    return row;
  }

  const [any] = await db
    .select({
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      billingPlan: organization.billingPlan,
    })
    .from(membership)
    .innerJoin(user, eq(membership.userId, user.id))
    .innerJoin(organization, eq(membership.organizationId, organization.id))
    .where(eq(user.email, CEO_EMAIL))
    .limit(1);

  if (!any) {
    throw new Error(`CEO organization not found for ${CEO_EMAIL}`);
  }

  return any;
}

async function ensureHoldingPlan(orgId: string, previous: string): Promise<void> {
  if (previous === "government") {
    console.log("CEO org already on Holding (government).");
    return;
  }

  await db
    .update(organization)
    .set({ billingPlan: "government", updatedAt: new Date() })
    .where(eq(organization.id, orgId));

  console.log(`CEO org plan: ${previous} → government (Holding)`);
}

async function ensureCeoMembership(
  userId: string,
  orgId: string,
): Promise<void> {
  const [existing] = await db
    .select({ id: membership.id, role: membership.role })
    .from(membership)
    .where(
      and(
        eq(membership.userId, userId),
        eq(membership.organizationId, orgId),
      ),
    )
    .limit(1);

  if (existing) {
    if (existing.role !== ROLE && existing.role !== "owner") {
      await db
        .update(membership)
        .set({ role: ROLE })
        .where(eq(membership.id, existing.id));
      console.log(`Updated CEO-org membership role → ${ROLE}`);
    } else {
      console.log(`Already member of CEO org as ${existing.role}`);
    }
    return;
  }

  await createMembership({
    userId,
    organizationId: orgId,
    role: ROLE,
  });
  console.log(`Added to CEO org as ${ROLE}`);
}

/**
 * Active workspace prefers `owner` over `operator`/`admin`.
 * Drop other memberships so the sales manager lands in the CEO org
 * and sees the demo workforce.
 */
async function preferCeoWorkspaceOnly(
  userId: string,
  ceoOrgId: string,
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
    if (row.orgId === ceoOrgId) {
      continue;
    }
    await db.delete(membership).where(eq(membership.id, row.id));
    console.log(
      `Removed extra membership: ${row.orgName} (${row.role}) so CEO org is active`,
    );
  }
}

async function main(): Promise<void> {
  const userId = await upsertCredentialUser();
  const ceoOrg = await resolveCeoOrganizationId();
  console.log(`CEO org: ${ceoOrg.name} (${ceoOrg.slug}) [${ceoOrg.id}]`);

  await ensureHoldingPlan(ceoOrg.id, ceoOrg.billingPlan);
  await ensureCeoMembership(userId, ceoOrg.id);
  await preferCeoWorkspaceOnly(userId, ceoOrg.id);

  console.log(
    "Done. Sales manager signs in to CEO Holding workspace for demos.",
  );
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
