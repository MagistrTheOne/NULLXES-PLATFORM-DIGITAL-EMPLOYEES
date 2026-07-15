import { eq } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { employeeLifecycleEvent } from "@/entities/employee-lifecycle/schema";
import { knowledgeChunk, knowledgeSource } from "@/entities/knowledge/schema";
import { createOrganization } from "@/entities/organization/create-organization";
import { employeeSession } from "@/entities/session/schema";
import { user } from "@/entities/user/schema";
import { db } from "@/shared/db/client";
import { getDefaultAnalyticsRange } from "./lib/date-range";
import { getDashboardAnalytics } from "./services/get-dashboard-analytics";
import { getMessageTimeseries } from "./queries/get-message-timeseries";
import { getRecentSessions } from "./queries/get-recent-sessions";
import { getSatisfactionTimeseries } from "./queries/get-satisfaction-timeseries";
import { getSessionTimeseries } from "./queries/get-session-timeseries";
import { getTopEmployees } from "./queries/get-top-employees";
import { getTopTopics } from "./queries/get-top-topics";
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
      organizationId: org.id,
      userId: TEST_USER_ID,
      status: "completed",
      startedAt: daysAgo(2),
      endedAt: daysAgo(2),
      durationSeconds: 600,
      messageCount: 24,
      satisfactionRating: "4.8",
      firstResponseMs: 1100,
      resolved: true,
      escalated: false,
      primaryTopic: "Sales Pipeline",
    },
    {
      employeeId: somnia.id,
      organizationId: org.id,
      userId: TEST_USER_ID,
      status: "completed",
      startedAt: daysAgo(1),
      endedAt: daysAgo(1),
      durationSeconds: 400,
      messageCount: 18,
      satisfactionRating: "4.5",
      firstResponseMs: 1300,
      resolved: true,
      escalated: false,
      primaryTopic: "Sales Pipeline",
    },
    {
      employeeId: somnia.id,
      organizationId: org.id,
      userId: TEST_USER_ID,
      status: "completed",
      startedAt: daysAgo(0),
      endedAt: daysAgo(0),
      durationSeconds: 300,
      messageCount: 12,
      satisfactionRating: "5.0",
      firstResponseMs: 900,
      resolved: true,
      escalated: false,
      primaryTopic: "Product Demo",
    },
    {
      employeeId: kaira.id,
      organizationId: org.id,
      userId: TEST_USER_ID,
      status: "completed",
      startedAt: daysAgo(3),
      endedAt: daysAgo(3),
      durationSeconds: 200,
      messageCount: 9,
      satisfactionRating: "4.2",
      firstResponseMs: 1500,
      resolved: false,
      escalated: true,
      primaryTopic: "Support Escalation",
    },
    {
      employeeId: kaira.id,
      organizationId: org.id,
      userId: TEST_USER_ID,
      status: "active",
      startedAt: daysAgo(0),
      messageCount: 3,
      firstResponseMs: 1800,
      resolved: false,
      escalated: false,
      primaryTopic: "Account Access",
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

  const range = getDefaultAnalyticsRange();
  const workspace = await getWorkspaceAnalytics(org.id, range);

  if (workspace.employees.totalEmployees !== 5) {
    throw new Error(`Expected 5 employees, got ${workspace.employees.totalEmployees}`);
  }

  if (workspace.sessions.totalSessions !== 5) {
    throw new Error(`Expected 5 sessions, got ${workspace.sessions.totalSessions}`);
  }

  if (workspace.conversation.totalMessages !== 66) {
    throw new Error(
      `Expected 66 messages, got ${workspace.conversation.totalMessages}`,
    );
  }

  if (workspace.conversation.ratedSessions !== 4) {
    throw new Error(
      `Expected 4 rated sessions, got ${workspace.conversation.ratedSessions}`,
    );
  }

  if (workspace.performance.averageFirstResponseMs !== 1320) {
    throw new Error(
      `Expected average response 1320ms, got ${workspace.performance.averageFirstResponseMs}`,
    );
  }

  if (workspace.performance.resolutionRatePercent !== 75) {
    throw new Error(
      `Expected resolution rate 75%, got ${workspace.performance.resolutionRatePercent}`,
    );
  }

  if (workspace.performance.escalationRatePercent !== 20) {
    throw new Error(
      `Expected escalation rate 20%, got ${workspace.performance.escalationRatePercent}`,
    );
  }

  console.log("Workspace analytics: counts validated");

  const timeseries = await getSessionTimeseries(org.id, range);

  if (timeseries.length !== 7) {
    throw new Error(`Expected 7 timeseries points, got ${timeseries.length}`);
  }

  const todayKey = daysAgo(0).toISOString().slice(0, 10);
  const todayPoint = timeseries.find((point) => point.date === todayKey);

  if (!todayPoint || todayPoint.sessions !== 2) {
    throw new Error(`Expected 2 sessions today, got ${todayPoint?.sessions ?? 0}`);
  }

  console.log("Session timeseries: aggregations validated");

  const messageTimeseries = await getMessageTimeseries(org.id, range);
  const totalMessagesInSeries = messageTimeseries.reduce(
    (sum, point) => sum + point.messages,
    0,
  );

  if (totalMessagesInSeries !== 66) {
    throw new Error(
      `Expected 66 messages in timeseries, got ${totalMessagesInSeries}`,
    );
  }

  const satisfactionTimeseries = await getSatisfactionTimeseries(org.id, range);
  const ratedDays = satisfactionTimeseries.filter(
    (point) => point.ratedSessions > 0,
  ).length;

  if (ratedDays < 3) {
    throw new Error("Expected satisfaction ratings across multiple days");
  }

  const topEmployees = await getTopEmployees(org.id, range);

  if (topEmployees[0]?.employeeId !== somnia.id || topEmployees[0]?.totalSessions !== 3) {
    throw new Error("Top employee ranking did not match fixture data");
  }

  const topTopics = await getTopTopics(org.id, range);

  if (topTopics[0]?.topic !== "Sales Pipeline" || topTopics[0]?.sessionCount !== 2) {
    throw new Error("Top topics did not match fixture data");
  }

  const recentSessions = await getRecentSessions(org.id, range);

  if (recentSessions.length !== 5) {
    throw new Error(`Expected 5 recent sessions, got ${recentSessions.length}`);
  }

  if (!recentSessions[0]?.userEmail.includes("analytics-verify")) {
    throw new Error("Recent sessions did not include user email");
  }

  console.log("W.2 analytics queries: validated");

  const dashboard = await getDashboardAnalytics(org.id, range);

  if (dashboard.recentLifecycle.length < 4) {
    throw new Error("Expected recent lifecycle events from fixture data");
  }

  if (dashboard.recentSessions.length !== 5) {
    throw new Error("Dashboard recent sessions missing fixture rows");
  }

  console.log("Dashboard analytics: entry point validated");
  console.log("Analytics verification passed");
}

verifyAnalytics().catch((error: unknown) => {
  console.error("Analytics verification failed", error);
  process.exit(1);
});
