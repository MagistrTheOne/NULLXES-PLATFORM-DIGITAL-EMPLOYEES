import { and, eq } from "drizzle-orm";
import type { ProviderConfigType } from "@/entities/provider-config";
import { employeeProviderConfig } from "@/entities/provider-config/schema";
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
): Promise<Record<string, unknown>> {
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
