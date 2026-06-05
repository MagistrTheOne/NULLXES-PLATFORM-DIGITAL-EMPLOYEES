import { eq } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { employeeLifecycleEvent } from "@/entities/employee-lifecycle/schema";
import { knowledgeChunk, knowledgeSource } from "@/entities/knowledge/schema";
import { createOrganization } from "@/entities/organization/create-organization";
import { employeeSession } from "@/entities/session/schema";
import { user } from "@/entities/user/schema";
import { db } from "@/shared/db/client";
import { getDashboardAnalytics } from "./services/get-dashboard-analytics";
import { getSessionTimeseries } from "./queries/get-session-timeseries";
import { getTopEmployees } from "./queries/get-top-employees";
import { getWorkspaceAnalytics } from "./queries/get-workspace-analytics";

const TEST_USER_ID = "analytics-verify-user";

async function ensureTestUser(): Promise<void> {
  const [existing] = await db
    .select()
    .from(user)
    .where(eq(user.id, TEST_USER_ID))
    .limit(1);

  if (!existing) {
    await db.insert(user).values({
      id: TEST_USER_ID,
      name: "Analytics Verify User",
      email: "analytics-verify@nullxes.local",
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

async function verifyAnalytics(): Promise<void> {
  await ensureTestUser();

  const org = await createOrganization({
    name: "Analytics Verify Org",
    slug: `analytics-verify-${Date.now()}`,
    type: "enterprise",
    status: "active",
  });

  const employeeFixtures = await db
    .insert(digitalEmployee)
    .values([
      {
        organizationId: org.id,
        name: "Somnia",
        role: "Enterprise Sales Employee",
        status: "active",
        avatarProvider: "anam",
        brainProvider: "openai",
      },
      {
        organizationId: org.id,
        name: "Kaira",
        role: "Customer Support Employee",
        status: "active",
        avatarProvider: "anam",
        brainProvider: "openai",
      },
      {
        organizationId: org.id,
        name: "Orion",
        role: "Operations Employee",
        status: "paused",
        avatarProvider: "anam",
        brainProvider: "anthropic",
      },
      {
        organizationId: org.id,
        name: "Atlas",
        role: "Automation Engineer",
        status: "draft",
        avatarProvider: "anam",
        brainProvider: "openai",
      },
      {
        organizationId: org.id,
        name: "Megan",
        role: "Legal Operations Employee",
        status: "archived",
        avatarProvider: "nullxes",
        brainProvider: "anthropic",
      },
    ])
    .returning();

  const [somnia, kaira] = employeeFixtures;

  if (!somnia || !kaira) {
    throw new Error("Failed to seed analytics employees");
  }

  await db.insert(employeeSession).values([
    {
      employeeId: somnia.id,
      userId: TEST_USER_ID,
      status: "completed",
      startedAt: daysAgo(2),
      endedAt: daysAgo(2),
      durationSeconds: 600,
    },
    {
      employeeId: somnia.id,
      userId: TEST_USER_ID,
      status: "completed",
      startedAt: daysAgo(1),
      endedAt: daysAgo(1),
      durationSeconds: 400,
    },
    {
      employeeId: somnia.id,
      userId: TEST_USER_ID,
      status: "completed",
      startedAt: daysAgo(0),
      endedAt: daysAgo(0),
      durationSeconds: 300,
    },
    {
      employeeId: kaira.id,
      userId: TEST_USER_ID,
      status: "completed",
      startedAt: daysAgo(3),
      endedAt: daysAgo(3),
      durationSeconds: 200,
    },
    {
      employeeId: kaira.id,
      userId: TEST_USER_ID,
      status: "active",
      startedAt: daysAgo(0),
    },
  ]);

  const sources = await db
    .insert(knowledgeSource)
    .values([
      {
        employeeId: somnia.id,
        type: "file",
        title: "Sales playbook",
        status: "ready",
      },
      {
        employeeId: kaira.id,
        type: "url",
        title: "Support FAQ",
        status: "ready",
      },
      {
        employeeId: employeeFixtures[2]!.id,
        type: "text",
        title: "Ops notes",
        status: "processing",
      },
      {
        employeeId: employeeFixtures[3]!.id,
        type: "file",
        title: "Broken import",
        status: "failed",
      },
      {
        employeeId: employeeFixtures[4]!.id,
        type: "text",
        title: "Legacy policy",
        status: "pending",
      },
    ])
    .returning();

  await db.insert(knowledgeChunk).values([
    {
      sourceId: sources[0]!.id,
      content: "Chunk A",
      chunkIndex: 0,
    },
    {
      sourceId: sources[0]!.id,
      content: "Chunk B",
      chunkIndex: 1,
    },
    {
      sourceId: sources[1]!.id,
      content: "Chunk C",
      chunkIndex: 0,
    },
  ]);

  await db.insert(employeeLifecycleEvent).values([
    {
      employeeId: somnia.id,
      actorUserId: TEST_USER_ID,
      eventType: "created",
      reason: "Fixture create",
      createdAt: daysAgo(2),
    },
    {
      employeeId: kaira.id,
      actorUserId: TEST_USER_ID,
      eventType: "created",
      reason: "Fixture create",
      createdAt: daysAgo(1),
    },
    {
      employeeId: somnia.id,
      actorUserId: TEST_USER_ID,
      eventType: "activated",
      reason: "Fixture activate",
      createdAt: daysAgo(1),
    },
    {
      employeeId: employeeFixtures[4]!.id,
      actorUserId: TEST_USER_ID,
      eventType: "archived",
      reason: "Fixture archive",
      createdAt: daysAgo(3),
    },
    {
      employeeId: kaira.id,
      actorUserId: TEST_USER_ID,
      eventType: "created",
      reason: "Outside window",
      createdAt: daysAgo(20),
    },
  ]);

  const workspace = await getWorkspaceAnalytics(org.id);

  if (workspace.employees.totalEmployees !== 5) {
    throw new Error(`Expected 5 employees, got ${workspace.employees.totalEmployees}`);
  }

  if (workspace.employees.activeEmployees !== 2) {
    throw new Error(`Expected 2 active employees, got ${workspace.employees.activeEmployees}`);
  }

  if (workspace.sessions.totalSessions !== 5) {
    throw new Error(`Expected 5 sessions, got ${workspace.sessions.totalSessions}`);
  }

  if (workspace.sessions.completedSessions !== 4) {
    throw new Error(
      `Expected 4 completed sessions, got ${workspace.sessions.completedSessions}`,
    );
  }

  if (workspace.sessions.totalConversationSeconds !== 1500) {
    throw new Error(
      `Expected 1500 conversation seconds, got ${workspace.sessions.totalConversationSeconds}`,
    );
  }

  if (workspace.sessions.averageSessionDurationSeconds !== 375) {
    throw new Error(
      `Expected average duration 375s, got ${workspace.sessions.averageSessionDurationSeconds}`,
    );
  }

  if (workspace.knowledge.totalSources !== 5) {
    throw new Error(`Expected 5 knowledge sources, got ${workspace.knowledge.totalSources}`);
  }

  if (workspace.knowledge.readySources !== 2) {
    throw new Error(`Expected 2 ready sources, got ${workspace.knowledge.readySources}`);
  }

  if (workspace.knowledge.processingSources !== 1) {
    throw new Error(
      `Expected 1 processing source, got ${workspace.knowledge.processingSources}`,
    );
  }

  if (workspace.knowledge.failedSources !== 1) {
    throw new Error(`Expected 1 failed source, got ${workspace.knowledge.failedSources}`);
  }

  if (workspace.knowledge.totalChunks !== 3) {
    throw new Error(`Expected 3 chunks, got ${workspace.knowledge.totalChunks}`);
  }

  if (workspace.activity.createdEmployeesLast7Days !== 2) {
    throw new Error(
      `Expected 2 created events in 7 days, got ${workspace.activity.createdEmployeesLast7Days}`,
    );
  }

  if (workspace.activity.activatedEmployeesLast7Days !== 1) {
    throw new Error(
      `Expected 1 activated event in 7 days, got ${workspace.activity.activatedEmployeesLast7Days}`,
    );
  }

  if (workspace.activity.archivedEmployeesLast7Days !== 1) {
    throw new Error(
      `Expected 1 archived event in 7 days, got ${workspace.activity.archivedEmployeesLast7Days}`,
    );
  }

  console.log("Workspace analytics: counts validated");

  const timeseries = await getSessionTimeseries(org.id);

  if (timeseries.length !== 30) {
    throw new Error(`Expected 30 timeseries points, got ${timeseries.length}`);
  }

  const todayKey = daysAgo(0).toISOString().slice(0, 10);
  const todayPoint = timeseries.find((point) => point.date === todayKey);

  if (!todayPoint || todayPoint.sessions !== 2) {
    throw new Error(`Expected 2 sessions today, got ${todayPoint?.sessions ?? 0}`);
  }

  const threeDaysAgoKey = daysAgo(3).toISOString().slice(0, 10);
  const threeDaysPoint = timeseries.find((point) => point.date === threeDaysAgoKey);

  if (!threeDaysPoint || threeDaysPoint.sessions !== 1) {
    throw new Error(
      `Expected 1 session 3 days ago, got ${threeDaysPoint?.sessions ?? 0}`,
    );
  }

  console.log("Session timeseries: aggregations validated");

  const topEmployees = await getTopEmployees(org.id);

  if (topEmployees[0]?.employeeId !== somnia.id || topEmployees[0]?.totalSessions !== 3) {
    throw new Error("Top employee ranking did not match fixture data");
  }

  if (topEmployees[1]?.employeeId !== kaira.id || topEmployees[1]?.totalSessions !== 2) {
    throw new Error("Second ranked employee did not match fixture data");
  }

  console.log("Top employees: ranking validated");

  const dashboard = await getDashboardAnalytics(org.id);

  if (dashboard.recentLifecycle.length < 4) {
    throw new Error("Expected recent lifecycle events from fixture data");
  }

  console.log("Dashboard analytics: entry point validated");
  console.log("Analytics verification passed");
}

verifyAnalytics().catch((error: unknown) => {
  console.error("Analytics verification failed", error);
  process.exit(1);
});
