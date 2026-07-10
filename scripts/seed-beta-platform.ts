/**
 * Seed beta platform catalog + partner shell orgs.
 *
 * - Publishes active digital employees from ceo@nullxes.com org into platform_employee_catalog
 * - Creates Yandex / Tinkoff enterprise shell orgs (idempotent by slug)
 *
 * Usage: npm run beta:seed
 */
import { and, asc, eq, ne } from "drizzle-orm";
import { digitalEmployee } from "../src/entities/digital-employee/schema";
import { membership } from "../src/entities/membership/schema";
import { organization } from "../src/entities/organization/schema";
import { platformEmployeeCatalog } from "../src/entities/platform-employee-catalog/schema";
import { user } from "../src/entities/user/schema";
import { db } from "../src/shared/db/client";

const CEO_EMAIL = "ceo@nullxes.com";

const PARTNER_ORGS = [
  {
    slug: "yandex-beta",
    nameEn: "Yandex",
    nameRu: "Яндекс",
    name: "Yandex / Яндекс",
    note: "Joining NULLXES beta",
  },
  {
    slug: "tinkoff-ba-b2b",
    nameEn: "Tinkoff — Business Analytics & B2B",
    nameRu: "Тинькофф — бизнес-аналитика и B2B",
    name: "Tinkoff — Business Analytics & B2B / Тинькофф — бизнес-аналитика и B2B",
    note: "Business analytics and B2B department shell",
  },
] as const;

async function resolveCeoOrganizationId(): Promise<string> {
  const fromEnv = process.env.PLATFORM_CATALOG_ORG_ID?.trim();
  if (fromEnv) {
    return fromEnv;
  }

  const [row] = await db
    .select({
      organizationId: membership.organizationId,
    })
    .from(membership)
    .innerJoin(user, eq(user.id, membership.userId))
    .where(eq(user.email, CEO_EMAIL))
    .limit(1);

  if (!row) {
    throw new Error(
      `No membership found for ${CEO_EMAIL}. Set PLATFORM_CATALOG_ORG_ID or ensure CEO has an org.`,
    );
  }

  return row.organizationId;
}

async function seedPlatformCatalog(ceoOrgId: string): Promise<number> {
  const employees = await db
    .select({
      id: digitalEmployee.id,
      name: digitalEmployee.name,
      status: digitalEmployee.status,
    })
    .from(digitalEmployee)
    .where(
      and(
        eq(digitalEmployee.organizationId, ceoOrgId),
        ne(digitalEmployee.status, "archived"),
      ),
    )
    .orderBy(asc(digitalEmployee.createdAt));

  if (employees.length === 0) {
    console.log("No CEO employees to publish.");
    return 0;
  }

  let published = 0;
  for (let index = 0; index < employees.length; index += 1) {
    const employee = employees[index]!;
    const [existing] = await db
      .select({ id: platformEmployeeCatalog.id })
      .from(platformEmployeeCatalog)
      .where(eq(platformEmployeeCatalog.employeeId, employee.id))
      .limit(1);

    if (existing) {
      await db
        .update(platformEmployeeCatalog)
        .set({
          isPublished: true,
          sortOrder: index,
        })
        .where(eq(platformEmployeeCatalog.id, existing.id));
      console.log(`  updated catalog: ${employee.name} (${employee.id})`);
    } else {
      await db.insert(platformEmployeeCatalog).values({
        employeeId: employee.id,
        isPublished: true,
        sortOrder: index,
      });
      console.log(`  published: ${employee.name} (${employee.id})`);
    }
    published += 1;
  }

  return published;
}

async function seedPartnerOrgs(): Promise<void> {
  for (const partner of PARTNER_ORGS) {
    const [existing] = await db
      .select({ id: organization.id, name: organization.name })
      .from(organization)
      .where(eq(organization.slug, partner.slug))
      .limit(1);

    if (existing) {
      await db
        .update(organization)
        .set({
          name: partner.name,
          type: "enterprise",
          billingPlan: "enterprise",
          status: "active",
          dataRegion: "ru",
        })
        .where(eq(organization.id, existing.id));
      console.log(
        `  partner org updated: ${partner.slug} (${existing.id}) — ${partner.note}`,
      );
      continue;
    }

    const [created] = await db
      .insert(organization)
      .values({
        name: partner.name,
        slug: partner.slug,
        type: "enterprise",
        billingPlan: "enterprise",
        status: "active",
        dataRegion: "ru",
      })
      .returning({ id: organization.id });

    console.log(
      `  partner org created: ${partner.slug} (${created?.id}) — EN: ${partner.nameEn} / RU: ${partner.nameRu}`,
    );
  }
}

async function main(): Promise<void> {
  console.log("Seeding beta platform catalog + partner orgs…\n");

  const ceoOrgId = await resolveCeoOrganizationId();
  console.log(`CEO catalog org: ${ceoOrgId}`);

  console.log("\nPlatform catalog:");
  const count = await seedPlatformCatalog(ceoOrgId);
  console.log(`Published ${count} employee(s).`);

  console.log("\nPartner orgs:");
  await seedPartnerOrgs();

  console.log("\nDone.");
  console.log(
    "Invite partner owners later via Settings → People (or organization_invite).",
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
