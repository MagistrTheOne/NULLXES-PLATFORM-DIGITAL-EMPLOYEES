import { eq } from "drizzle-orm";
import { getDefaultAnalyticsRange } from "@/features/analytics/lib/date-range";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { employeeLifecycleEvent } from "@/entities/employee-lifecycle/schema";
import { createOrganization } from "@/entities/organization/create-organization";
import { employeeSession } from "@/entities/session/schema";
import { user } from "@/entities/user/schema";
import { db } from "@/shared/db/client";
import { getDashboardOverview } from "./services/get-dashboard-overview";
import { getActiveSessionCount } from "./queries/get-active-session-count";
import { getEmployeeSessionSummaries } from "./queries/get-employee-session-summaries";
import { getLiveSessions } from "./queries/get-live-sessions";

const TEST_USER_ID = "overview-verify-user";

async function ensureTestUser(): Promise<void> {
  const [existing] = await db
    .select()
    .from(user)
    .where(eq(user.id, TEST_USER_ID))
    .limit(1);

  if (!existing) {
    await db.insert(user).values({
      id: TEST_USER_ID,
      name: "Overview Verify User",
      email: "overview-verify@nullxes.local",
      emailVerified: true,
      status: "active",
    });
  }
}

function daysAgo(dayOffset: number): Date {
  const date = new Date();
  date.setUTCHours(12, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() - dayOffset);
  return date;
}

async function verifyOverview(): Promise<void> {
  await ensureTestUser();

  const org = await createOrganization({
    name: "Overview Verify Org",
    slug: `overview-verify-${Date.now()}`,
    type: "enterprise",
    status: "active",
  });

  const [employee] = await db
    .insert(digitalEmployee)
    .values({
      organizationId: org.id,
      name: "Somnia",
      role: "Enterprise Sales Employee",
      status: "active",
      avatarProvider: "anam",
      brainProvider: "openai",
    })
    .returning();

  if (!employee) {
    throw new Error("Failed to seed overview employee");
  }

  await db.insert(employeeSession).values([
    {
      employeeId: employee.id,
      userId: TEST_USER_ID,
      status: "completed",
      startedAt: daysAgo(1),
      endedAt: daysAgo(1),
      durationSeconds: 420,
      messageCount: 12,
      satisfactionRating: "4.6",
      resolved: true,
    },
    {
      employeeId: employee.id,
      userId: TEST_USER_ID,
      status: "active",
      startedAt: daysAgo(0),
      messageCount: 2,
    },
  ]);

  await db.insert(employeeLifecycleEvent).values({
    employeeId: employee.id,
    actorUserId: TEST_USER_ID,
    eventType: "activated",
    reason: "Overview fixture",
    createdAt: daysAgo(0),
  });

  const range = getDefaultAnalyticsRange();
  const activeNow = await getActiveSessionCount(org.id);

  if (activeNow !== 1) {
    throw new Error(`Expected 1 active session, got ${activeNow}`);
  }

  const summaries = await getEmployeeSessionSummaries(org.id, range);

  if (summaries[0]?.sessionsInRange !== 2) {
    throw new Error("Employee session summary did not match fixture data");
  }

  const liveSessions = await getLiveSessions(org.id);

  if (liveSessions.length !== 1) {
    throw new Error(`Expected 1 live session row, got ${liveSessions.length}`);
  }

  const overview = await getDashboardOverview(org.id, range);

  if (overview.metrics.employees.total !== 1) {
    throw new Error("Overview employee total mismatch");
  }

  if (overview.metrics.activeNow !== 1) {
    throw new Error("Overview active now mismatch");
  }

  if (overview.employees.length !== 1) {
    throw new Error("Overview employee list mismatch");
  }

  if (overview.employees[0]?.sessionsInRange !== 2) {
    throw new Error("Overview merged employee sessions mismatch");
  }

  if (overview.recentActivity.length < 1) {
    throw new Error("Overview recent activity missing fixture event");
  }

  if (overview.systemStatus.length < 4) {
    throw new Error("Overview system status incomplete");
  }

  console.log("Dashboard overview verification passed");
}

verifyOverview().catch((error: unknown) => {
  console.error("Dashboard overview verification failed", error);
  process.exit(1);
});
