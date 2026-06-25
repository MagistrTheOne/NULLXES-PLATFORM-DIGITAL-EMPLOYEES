import { hqTask, type HqTaskDestination } from "@/entities/hq-task";
import { db } from "@/shared/db/client";

/** How long an errand keeps the employee on the move before it auto-completes. */
export const HQ_TASK_DURATION_MS = 90_000;

const DESTINATION_LABELS: Record<
  "en" | "ru",
  Record<HqTaskDestination, string>
> = {
  en: {
    reception: "Reception",
    sales: "CRM / Sales",
    support: "Support",
    hr: "HR",
    analytics: "Analytics",
    executive: "Executive",
  },
  ru: {
    reception: "Ресепшн",
    sales: "CRM / Продажи",
    support: "Поддержка",
    hr: "HR",
    analytics: "Аналитика",
    executive: "Руководство",
  },
};

export function buildHqTaskLabel(
  destination: HqTaskDestination,
  locale: string,
): string {
  const table = locale === "ru" ? DESTINATION_LABELS.ru : DESTINATION_LABELS.en;
  return `→ ${table[destination]}`;
}

/**
 * Create a running floor errand. The employee will physically walk to the
 * destination room until the task expires (then it is lazily marked done).
 */
export async function createHqTask(input: {
  organizationId: string;
  employeeId: string;
  destination: HqTaskDestination;
  label: string;
}): Promise<void> {
  const now = Date.now();
  await db.insert(hqTask).values({
    organizationId: input.organizationId,
    employeeId: input.employeeId,
    destination: input.destination,
    label: input.label,
    status: "running",
    startedAt: new Date(now),
    expiresAt: new Date(now + HQ_TASK_DURATION_MS),
  });
}
