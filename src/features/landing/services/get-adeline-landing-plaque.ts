import { and, count, eq, gte, lte, max } from "drizzle-orm";
import type { EmployeeStatus } from "@/entities/digital-employee";
import type { AvatarProviderConfigPayload } from "@/entities/provider-config";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { employeeProviderConfig } from "@/entities/provider-config/schema";
import { employeeSession } from "@/entities/session/schema";
import {
  endOfUtcDay,
  getDefaultAnalyticsRange,
  startOfUtcDay,
} from "@/features/analytics/lib/date-range";
import { ADELINE_KALEN_EMPLOYEE_ID } from "@/shared/config/xai-voice-env";
import { db } from "@/shared/db/client";
import { withDatabaseRetry } from "@/shared/db/with-database-retry";

export type AdelineLandingPlaque = {
  id: string;
  name: string;
  role: string;
  status: EmployeeStatus;
  avatarPreviewUrl: string | null;
  avatarProvisioningStatus: "pending" | "provisioning" | "ready" | "failed";
  sessionsInRange: number;
  lastSessionAt: string | null;
};

const FALLBACK: AdelineLandingPlaque = {
  id: ADELINE_KALEN_EMPLOYEE_ID,
  name: "Adeline Kalen",
  role: "Head of the Interworld Department",
  status: "active",
  avatarPreviewUrl: "/marketing/adeline-kalen.jpg",
  avatarProvisioningStatus: "ready",
  sessionsInRange: 0,
  lastSessionAt: null,
};

function readProvisioningStatus(
  value: unknown,
): AdelineLandingPlaque["avatarProvisioningStatus"] {
  if (
    value === "pending" ||
    value === "provisioning" ||
    value === "ready" ||
    value === "failed"
  ) {
    return value;
  }
  return "pending";
}

/**
 * Public marketing read for the landing hero plaque.
 * Loads Adeline Kalen by known platform ID — no workspace auth required.
 */
export async function getAdelineLandingPlaque(): Promise<AdelineLandingPlaque> {
  try {
    return await withDatabaseRetry(async () => {
      const range = getDefaultAnalyticsRange();

      const [employee] = await db
        .select({
          id: digitalEmployee.id,
          name: digitalEmployee.name,
          role: digitalEmployee.role,
          status: digitalEmployee.status,
        })
        .from(digitalEmployee)
        .where(eq(digitalEmployee.id, ADELINE_KALEN_EMPLOYEE_ID))
        .limit(1);

      if (!employee) {
        return FALLBACK;
      }

      const [avatarRow, sessionSummary] = await Promise.all([
        db
          .select({ config: employeeProviderConfig.config })
          .from(employeeProviderConfig)
          .where(
            and(
              eq(employeeProviderConfig.employeeId, ADELINE_KALEN_EMPLOYEE_ID),
              eq(employeeProviderConfig.providerType, "avatar"),
            ),
          )
          .limit(1)
          .then((rows) => rows[0] ?? null),
        db
          .select({
            sessionsInRange: count(employeeSession.id),
            lastSessionAt: max(employeeSession.startedAt),
          })
          .from(employeeSession)
          .where(
            and(
              eq(employeeSession.employeeId, ADELINE_KALEN_EMPLOYEE_ID),
              gte(employeeSession.startedAt, startOfUtcDay(range.from)),
              lte(employeeSession.startedAt, endOfUtcDay(range.to)),
            ),
          )
          .then((rows) => rows[0] ?? null),
      ]);

      const avatarConfig = avatarRow?.config as
        | AvatarProviderConfigPayload
        | undefined;

      return {
        id: ADELINE_KALEN_EMPLOYEE_ID,
        name: employee.name,
        role: employee.role,
        status: employee.status,
        avatarPreviewUrl:
          avatarConfig?.previewUrl ?? "/marketing/adeline-kalen.jpg",
        avatarProvisioningStatus: avatarConfig?.previewUrl
          ? readProvisioningStatus(avatarConfig.provisioningStatus)
          : "ready",
        sessionsInRange: Number(sessionSummary?.sessionsInRange ?? 0),
        lastSessionAt: sessionSummary?.lastSessionAt?.toISOString() ?? null,
      };
    });
  } catch {
    return FALLBACK;
  }
}
