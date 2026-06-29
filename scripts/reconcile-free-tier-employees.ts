import { and, asc, count, eq } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { employeeProviderConfig } from "@/entities/provider-config/schema";
import { organization } from "@/entities/organization/schema";
import { BILLING_PLANS } from "@/features/billing/config/plans";
import { resolveBillingPlanId } from "@/features/billing/lib/resolve-billing-plan";
import { isWorkforceAvatarPresetId } from "@/features/employees/studio/avatar/avatar-preset-catalog";
import { loadEnvFiles } from "@/shared/config/load-env-files";
import { db } from "@/shared/db/client";

loadEnvFiles();

const shouldApply = process.argv.includes("--apply");

function isCustomAvatarConfig(config: Record<string, unknown>): boolean {
  const metadata =
    (config.providerMetadata as Record<string, unknown> | undefined) ?? {};

  if (metadata.presetAvatarId && isWorkforceAvatarPresetId(String(metadata.presetAvatarId))) {
    return false;
  }

  if (typeof config.imageUrl === "string" && config.imageUrl.trim()) {
    return true;
  }

  if (typeof config.photoFileName === "string" && config.photoFileName.trim()) {
    return true;
  }

  return false;
}

async function main(): Promise<void> {
  const orgs = await db
    .select({
      id: organization.id,
      name: organization.name,
      billingPlan: organization.billingPlan,
    })
    .from(organization);

  let archivedCount = 0;
  let flaggedCustomAvatars = 0;

  for (const org of orgs) {
    const planId = resolveBillingPlanId(org.billingPlan);
    if (planId !== "free") {
      continue;
    }

    const maxEmployees = BILLING_PLANS.free.limits.maxEmployees ?? 1;

    const employees = await db
      .select({
        id: digitalEmployee.id,
        name: digitalEmployee.name,
        status: digitalEmployee.status,
        createdAt: digitalEmployee.createdAt,
      })
      .from(digitalEmployee)
      .where(eq(digitalEmployee.organizationId, org.id))
      .orderBy(asc(digitalEmployee.createdAt));

    if (employees.length > maxEmployees) {
      const extras = employees.slice(maxEmployees);
      console.log(
        `\nFree org "${org.name}" (${org.id}): ${employees.length} employees, limit ${maxEmployees}`,
      );

      for (const employee of extras) {
        console.log(`  - over limit: ${employee.name} (${employee.id}) status=${employee.status}`);
        if (shouldApply) {
          await db
            .update(digitalEmployee)
            .set({ status: "archived" })
            .where(eq(digitalEmployee.id, employee.id));
          archivedCount += 1;
        }
      }
    }

    for (const employee of employees) {
      const [avatarRow] = await db
        .select({ config: employeeProviderConfig.config })
        .from(employeeProviderConfig)
        .where(
          and(
            eq(employeeProviderConfig.employeeId, employee.id),
            eq(employeeProviderConfig.providerType, "avatar"),
          ),
        )
        .limit(1);

      const avatarConfig = avatarRow?.config as Record<string, unknown> | undefined;
      if (!avatarConfig || !isCustomAvatarConfig(avatarConfig)) {
        continue;
      }

      flaggedCustomAvatars += 1;
      console.log(
        `  - custom avatar on free plan: ${employee.name} (${employee.id})`,
      );

      if (shouldApply) {
        await db
          .update(employeeProviderConfig)
          .set({
            config: {
              ...avatarConfig,
              provisioningStatus: "failed",
              failureReason:
                "Custom avatars require Super Pro. Choose a NULLXES preset or upgrade your plan.",
            },
          })
          .where(
            and(
              eq(employeeProviderConfig.employeeId, employee.id),
              eq(employeeProviderConfig.providerType, "avatar"),
            ),
          );
      }
    }
  }

  const [freeOrgCount] = await db
    .select({ total: count() })
    .from(organization)
    .where(eq(organization.billingPlan, "free"));

  console.log("\nSummary:", {
    freeOrganizations: Number(freeOrgCount?.total ?? 0),
    archivedEmployees: archivedCount,
    flaggedCustomAvatars,
    mode: shouldApply ? "apply" : "dry-run",
  });

  if (!shouldApply) {
    console.log("\nDry run only. Re-run with --apply to archive extras and flag custom avatars.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
