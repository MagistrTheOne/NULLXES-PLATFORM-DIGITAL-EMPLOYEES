import { and, count, eq, gte, inArray, lte } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { db } from "@/shared/db/client";
import { computeTrend } from "../lib/compute-trend";
import {
  endOfUtcDay,
  getPreviousAnalyticsRange,
  startOfUtcDay,
} from "../lib/date-range";
import type { AnalyticsDateRange, AnalyticsTrends } from "../types";
import { getConversationMetrics } from "./get-conversation-metrics";
import { getSessionMetrics } from "./get-session-metrics";

async function countEmployeesCreatedInRange(
  organizationId: string,
  range: AnalyticsDateRange,
  employeeIds?: string[],
): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(digitalEmployee)
    .where(
      and(
        eq(digitalEmployee.organizationId, organizationId),
        gte(digitalEmployee.createdAt, startOfUtcDay(range.from)),
        lte(digitalEmployee.createdAt, endOfUtcDay(range.to)),
        employeeIds ? inArray(digitalEmployee.id, employeeIds) : undefined,
      ),
    );

  return Number(row?.total ?? 0);
}

export async function getAnalyticsTrends(
  organizationId: string,
  range: AnalyticsDateRange,
  employeeIds?: string[],
): Promise<AnalyticsTrends> {
  const previousRange = getPreviousAnalyticsRange(range);

  const [
    sessions,
    conversation,
    previousSessions,
    previousConversation,
    employeesCreated,
    previousEmployeesCreated,
  ] = await Promise.all([
    getSessionMetrics(organizationId, range, employeeIds),
    getConversationMetrics(organizationId, range, employeeIds),
    getSessionMetrics(organizationId, previousRange, employeeIds),
    getConversationMetrics(organizationId, previousRange, employeeIds),
    countEmployeesCreatedInRange(organizationId, range, employeeIds),
    countEmployeesCreatedInRange(organizationId, previousRange, employeeIds),
  ]);

  const satisfactionTrend =
    conversation.ratedSessions > 0 || previousConversation.ratedSessions > 0
      ? computeTrend(
          conversation.averageSatisfaction ?? 0,
          previousConversation.averageSatisfaction ?? 0,
        )
      : null;

  return {
    employees: computeTrend(employeesCreated, previousEmployeesCreated),
    sessions: computeTrend(
      sessions.totalSessions,
      previousSessions.totalSessions,
    ),
    conversationSeconds: computeTrend(
      sessions.totalConversationSeconds,
      previousSessions.totalConversationSeconds,
    ),
    messages: computeTrend(
      conversation.totalMessages,
      previousConversation.totalMessages,
    ),
    satisfaction: satisfactionTrend,
  };
}
