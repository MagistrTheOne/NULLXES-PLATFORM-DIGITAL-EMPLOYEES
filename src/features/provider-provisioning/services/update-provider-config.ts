import { and, eq } from "drizzle-orm";
import type { ProviderConfigType } from "@/entities/provider-config";
import { employeeProviderConfig } from "@/entities/provider-config/schema";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { forbidCatalogMutation } from "@/features/employees/services/platform-employee-catalog";
import { db } from "@/shared/db/client";

export async function getProviderConfigRow(
  employeeId: string,
  providerType: ProviderConfigType,
) {
  const [row] = await db
    .select()
    .from(employeeProviderConfig)
    .where(
      and(
        eq(employeeProviderConfig.employeeId, employeeId),
        eq(employeeProviderConfig.providerType, providerType),
      ),
    )
    .limit(1);

  return row ?? null;
}

export async function mergeProviderConfig(
  employeeId: string,
  providerType: ProviderConfigType,
  patch: Record<string, unknown>,
  options?: { allowCatalogMutation?: boolean; organizationId?: string },
): Promise<Record<string, unknown>> {
  if (!options?.allowCatalogMutation) {
    let organizationId = options?.organizationId;
    if (!organizationId) {
      const [employee] = await db
        .select({ organizationId: digitalEmployee.organizationId })
        .from(digitalEmployee)
        .where(eq(digitalEmployee.id, employeeId))
        .limit(1);
      organizationId = employee?.organizationId;
    }
    await forbidCatalogMutation(employeeId, organizationId);
  }

  const row = await getProviderConfigRow(employeeId, providerType);
  if (!row) {
    throw new Error(`Provider config missing for type ${providerType}`);
  }

  const nextConfig = {
    ...(row.config as Record<string, unknown>),
    ...patch,
  };

  await db
    .update(employeeProviderConfig)
    .set({ config: nextConfig })
    .where(eq(employeeProviderConfig.id, row.id));

  return nextConfig;
}
