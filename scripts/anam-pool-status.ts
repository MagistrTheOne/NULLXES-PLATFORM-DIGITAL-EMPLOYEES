/**
 * One-shot CLI: Anam lab key occupancy for demo readiness.
 * Usage: node --env-file=.env --import tsx scripts/anam-pool-status.ts
 */
import { neon } from "@neondatabase/serverless";

const SLOTS = [
  "ANAM_API_KEY",
  "ANAM_API_KEY_2",
  "ANAM_API_KEY_3",
  "ANAM_API_KEY_4",
  "ANAM_API_KEY_5",
  "ANAM_API_KEY_6",
  "ANAM_API_KEY_7",
  "ANAM_API_KEY_8",
  "ANAM_API_KEY_9",
  "ANAM_API_KEY_10",
  "ANAM_API_KEY_11",
  "ANAM_API_KEY_12",
  "ANAM_API_KEY_13",
  "ANAM_API_KEY_14",
  "ANAM_API_KEY_15",
  "ANAM_API_KEY_16",
  "ANAM_API_KEY_17",
  "ANAM_API_KEY_18",
  "ANAM_API_KEY_19",
  "ANAM_API_KEY_20",
] as const;

const maxRaw = process.env.ANAM_MAX_PERSONAS_PER_KEY?.trim();
const maxPersonasPerKey =
  maxRaw && Number.isFinite(Number(maxRaw)) && Number(maxRaw) > 0
    ? Math.floor(Number(maxRaw))
    : 1;

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const sql = neon(databaseUrl);

type EmpRow = {
  id: string;
  name: string;
  avatar_provider: string | null;
  config: Record<string, unknown> | null;
};

async function probeKey(apiKey: string): Promise<{ ok: boolean; detail: string }> {
  try {
    const response = await fetch("https://api.anam.ai/v1/personas?perPage=1", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (response.ok) {
      return { ok: true, detail: "valid" };
    }
    const text = await response.text();
    return { ok: false, detail: `HTTP ${response.status}: ${text.slice(0, 120)}` };
  } catch (error: unknown) {
    return {
      ok: false,
      detail: error instanceof Error ? error.message : "request failed",
    };
  }
}

async function main() {
  const rows = (await sql`
    select
      e.id,
      e.name,
      e.avatar_provider,
      c.config
    from digital_employee e
    left join employee_provider_config c
      on c.employee_id = e.id
     and c.provider_type = 'avatar'
    where e.avatar_provider = 'anam'
    order by e.created_at
  `) as EmpRow[];

  const bySlot = new Map<string, Array<{ name: string; provisioning: string; hasPersona: boolean }>>();
  for (const slot of SLOTS) {
    bySlot.set(slot, []);
  }

  for (const row of rows) {
    const config = (row.config ?? {}) as Record<string, unknown>;
    const metadata =
      config.providerMetadata && typeof config.providerMetadata === "object"
        ? (config.providerMetadata as Record<string, unknown>)
        : {};
    const slot =
      typeof metadata.anamApiKeySlot === "string"
        ? metadata.anamApiKeySlot
        : "ANAM_API_KEY";
    const list = bySlot.get(slot) ?? [];
    list.push({
      name: row.name,
      provisioning:
        typeof config.provisioningStatus === "string"
          ? config.provisioningStatus
          : "(none)",
      hasPersona: typeof config.personaId === "string",
    });
    bySlot.set(slot, list);
  }

  const report = [];
  for (const [index, slot] of SLOTS.entries()) {
    const key = process.env[slot]?.trim();
    const employees = bySlot.get(slot) ?? [];
    const personaCount = employees.filter((e) => e.hasPersona).length;
    const configured = Boolean(key);
    const health = configured ? await probeKey(key!) : null;
    const free = configured ? Math.max(0, maxPersonasPerKey - personaCount) : 0;

    report.push({
      lab: `lab-${index + 1}`,
      slot,
      configured,
      healthy: health?.ok ?? null,
      healthDetail: health?.detail ?? null,
      personaCount,
      capacity: configured ? maxPersonasPerKey : 0,
      free,
      atCapacity: configured && personaCount >= maxPersonasPerKey,
      employees,
    });
  }

  const freeLabs = report.filter((r) => r.configured && r.free > 0 && r.healthy !== false);
  const busyLabs = report.filter((r) => r.configured && r.atCapacity);
  const brokenLabs = report.filter((r) => r.configured && r.healthy === false);

  console.log(
    JSON.stringify(
      {
        maxPersonasPerKey,
        summary: {
          configured: report.filter((r) => r.configured).length,
          freeLabs: freeLabs.map((r) => r.lab),
          busyFull: busyLabs.map((r) => r.lab),
          unhealthy: brokenLabs.map((r) => ({ lab: r.lab, detail: r.healthDetail })),
          freePersonaSlots: freeLabs.reduce((sum, r) => sum + r.free, 0),
        },
        labs: report.filter((r) => r.configured),
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
