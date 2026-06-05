import { and, gte, lte } from "drizzle-orm";
import { employeeSession } from "@/entities/session/schema";
import type { AnalyticsDateRange } from "../types";
import { endOfUtcDay, startOfUtcDay } from "./date-range";

export function sessionStartedInRange(range: AnalyticsDateRange) {
  return and(
    gte(employeeSession.startedAt, startOfUtcDay(range.from)),
    lte(employeeSession.startedAt, endOfUtcDay(range.to)),
  );
}
