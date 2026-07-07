import { eq } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { employeeProviderConfig } from "@/entities/provider-config/schema";
import {
  ANAM_API_KEY_SLOTS,
  getAnamApiKeyPool,
  probeAnamApiKeyHealth,
  type AnamApiKeySlot,
} from "@/shared/config/anam-api-pool";
import { db } from "@/shared/db/client";

function getMaxPersonasPerKey(): number {
  const raw = process.env.ANAM_MAX_PERSONAS_PER_KEY?.trim();
  const parsed = raw ? Number(raw) : Number.NaN;
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1;
}

function readProviderMetadata(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const metadata = config.providerMetadata;
  if (metadata && typeof metadata === "object" && metadata !== null) {
    return metadata as Record<string, unknown>;
  }
  return {};
}

export type AnamAdminEmployeeRow = {
  id: string;
  name: string;
  status: string;
  provisioningStatus: string;
  personaId: string | null;
  avatarId: string | null;
  failureReason: string | null;
  slot: string;
};

export type AnamAdminSlotStatus = {
  slot: AnamApiKeySlot;
  label: string;
  configured: boolean;
  credentialHealthy: boolean | null;
  credentialDetail: string | null;
  personaCount: number;
  atCapacity: boolean;
  employees: AnamAdminEmployeeRow[];
};

export type AnamPoolStatus = {
  configuredSlotCount: number;
  totalSlots: number;
  maxPersonasPerKey: number;
  slots: AnamAdminSlotStatus[];
  unassignedEmployees: AnamAdminEmployeeRow[];
  failedEmployees: AnamAdminEmployeeRow[];
  totalEmployees: number;
};

export async function getAnamPoolStatus(): Promise<AnamPoolStatus> {
  const pool = getAnamApiKeyPool();
  const configuredSlots = new Set(pool.map((entry) => entry.slot));
  const firstSlot = pool[0]?.slot ?? "ANAM_API_KEY";
  const maxPersonasPerKey = getMaxPersonasPerKey();

  const employees = await db
    .select({
      id: digitalEmployee.id,
      name: digitalEmployee.name,
      status: digitalEmployee.status,
      avatarProvider: digitalEmployee.avatarProvider,
    })
    .from(digitalEmployee)
    .orderBy(digitalEmployee.createdAt);

  const avatarConfigs = await db
    .select({
      employeeId: employeeProviderConfig.employeeId,
      config: employeeProviderConfig.config,
    })
    .from(employeeProviderConfig)
    .where(eq(employeeProviderConfig.providerType, "avatar"));

  const configByEmployee = new Map(
    avatarConfigs.map((row) => [row.employeeId, row.config as Record<string, unknown>]),
  );

  const slotEmployees = new Map<string, AnamAdminEmployeeRow[]>();
  for (const slot of ANAM_API_KEY_SLOTS) {
    slotEmployees.set(slot, []);
  }
  slotEmployees.set("(default → first slot)", []);

  const unassignedEmployees: AnamAdminEmployeeRow[] = [];
  const failedEmployees: AnamAdminEmployeeRow[] = [];

  for (const employee of employees) {
    if (employee.avatarProvider !== "anam") {
      continue;
    }

    const config = configByEmployee.get(employee.id) ?? {};
    const metadata = readProviderMetadata(config);
    const hasPinnedSlot = typeof metadata.anamApiKeySlot === "string";
    const slot = hasPinnedSlot
      ? (metadata.anamApiKeySlot as string)
      : "(default → first slot)";
    const effectiveSlot = hasPinnedSlot ? slot : firstSlot;

    const row: AnamAdminEmployeeRow = {
      id: employee.id,
      name: employee.name,
      status: employee.status,
      provisioningStatus:
        typeof config.provisioningStatus === "string"
          ? config.provisioningStatus
          : "(none)",
      personaId:
        typeof config.personaId === "string" ? config.personaId : null,
      avatarId: typeof config.avatarId === "string" ? config.avatarId : null,
      failureReason:
        typeof config.failureReason === "string" ? config.failureReason : null,
      slot,
    };

    if (!hasPinnedSlot && config.personaId) {
      unassignedEmployees.push(row);
    }

    if (row.provisioningStatus === "failed") {
      failedEmployees.push(row);
    }

    const bucket = slotEmployees.get(effectiveSlot) ?? [];
    bucket.push(row);
    slotEmployees.set(effectiveSlot, bucket);
  }

  const slots: AnamAdminSlotStatus[] = await Promise.all(
    ANAM_API_KEY_SLOTS.map(async (slot, index) => {
      const poolEntry = pool.find((entry) => entry.slot === slot);
      const employeesOnSlot = slotEmployees.get(slot) ?? [];
      const personaCount = employeesOnSlot.filter((row) => row.personaId).length;
      const configured = configuredSlots.has(slot);
      let credentialHealthy: boolean | null = null;
      let credentialDetail: string | null = null;

      if (poolEntry) {
        const probe = await probeAnamApiKeyHealth(poolEntry.key);
        credentialHealthy = probe.healthy;
        credentialDetail = probe.detail;
      }

      return {
        slot,
        label: poolEntry?.label ?? `lab-${index + 1}`,
        configured,
        credentialHealthy,
        credentialDetail,
        personaCount,
        atCapacity: configured && personaCount >= maxPersonasPerKey,
        employees: employeesOnSlot,
      };
    }),
  );

  return {
    configuredSlotCount: pool.length,
    totalSlots: ANAM_API_KEY_SLOTS.length,
    maxPersonasPerKey,
    slots,
    unassignedEmployees,
    failedEmployees,
    totalEmployees: employees.filter((row) => row.avatarProvider === "anam")
      .length,
  };
}
