import { and, eq } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { employeeScenarioSession } from "@/entities/employee-scenario-session/schema";
import type { ScenarioSessionMetrics } from "@/entities/employee-scenario-session";
import { db } from "@/shared/db/client";
import { getScenarioTemplateById } from "../lib/scenario-templates";

export async function createScenarioSession(input: {
  organizationId: string;
  employeeId: string;
  userId: string;
  templateId: string;
}): Promise<string> {
  const template = getScenarioTemplateById(input.templateId);
  if (!template) {
    throw new Error("Scenario template not found");
  }

  const employee = await db.query.digitalEmployee.findFirst({
    where: and(
      eq(digitalEmployee.id, input.employeeId),
      eq(digitalEmployee.organizationId, input.organizationId),
    ),
  });

  if (!employee) {
    throw new Error("Employee not found");
  }

  const metrics: ScenarioSessionMetrics = {
    startedAt: new Date().toISOString(),
  };

  const [row] = await db
    .insert(employeeScenarioSession)
    .values({
      organizationId: input.organizationId,
      employeeId: input.employeeId,
      userId: input.userId,
      templateId: input.templateId,
      status: "pending",
      metrics,
    })
    .returning({ id: employeeScenarioSession.id });

  if (!row) {
    throw new Error("Failed to create scenario session");
  }

  return row.id;
}

export async function getScenarioSessionForUser(input: {
  scenarioSessionId: string;
  organizationId: string;
  userId: string;
}) {
  const row = await db.query.employeeScenarioSession.findFirst({
    where: and(
      eq(employeeScenarioSession.id, input.scenarioSessionId),
      eq(employeeScenarioSession.organizationId, input.organizationId),
      eq(employeeScenarioSession.userId, input.userId),
    ),
    with: {
      employee: true,
    },
  });

  if (!row?.employee) {
    return null;
  }

  return row;
}

export async function linkScenarioTalkSession(input: {
  scenarioSessionId: string;
  organizationId: string;
  userId: string;
  talkSessionId: string;
}): Promise<void> {
  const row = await getScenarioSessionForUser({
    scenarioSessionId: input.scenarioSessionId,
    organizationId: input.organizationId,
    userId: input.userId,
  });

  if (!row) {
    throw new Error("Scenario session not found");
  }

  if (row.status === "completed" || row.status === "abandoned") {
    throw new Error("Scenario session is no longer active");
  }

  await db
    .update(employeeScenarioSession)
    .set({
      talkSessionId: input.talkSessionId,
      status: "in_talk",
    })
    .where(eq(employeeScenarioSession.id, input.scenarioSessionId));
}

export async function getActiveScenarioSessionForTalk(input: {
  scenarioSessionId: string;
  organizationId: string;
  employeeId: string;
  userId: string;
}) {
  const row = await db.query.employeeScenarioSession.findFirst({
    where: and(
      eq(employeeScenarioSession.id, input.scenarioSessionId),
      eq(employeeScenarioSession.organizationId, input.organizationId),
      eq(employeeScenarioSession.employeeId, input.employeeId),
      eq(employeeScenarioSession.userId, input.userId),
    ),
  });

  if (!row) {
    return null;
  }

  if (row.status === "completed" || row.status === "abandoned") {
    return null;
  }

  return row;
}
