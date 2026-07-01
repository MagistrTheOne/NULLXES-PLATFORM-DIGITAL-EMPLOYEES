import { eq } from "drizzle-orm";
import type { ScenarioDebrief } from "@/entities/employee-scenario-session";
import { employeeScenarioSession } from "@/entities/employee-scenario-session/schema";
import { employeeSessionMessage } from "@/entities/session-message/schema";
import { db } from "@/shared/db/client";
import { collectTalkBrainResponse } from "@/features/runtime-session/services/stream-talk-brain-response";
import { getEmployeeTalkContext } from "@/features/runtime-session/services/get-employee-talk-context";
import { resolveBrainApiConfig } from "@/features/brain/lib/resolve-brain-api-config";
import { getScenarioTemplateById } from "../lib/scenario-templates";
import { getScenarioSessionForUser } from "./scenario-session";

function parseDebriefJson(raw: string): ScenarioDebrief | null {
  const trimmed = raw.trim();
  const jsonStart = trimmed.indexOf("{");
  const jsonEnd = trimmed.lastIndexOf("}");
  if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) {
    return null;
  }

  try {
    const parsed = JSON.parse(trimmed.slice(jsonStart, jsonEnd + 1)) as ScenarioDebrief;
    if (
      typeof parsed.score !== "number" ||
      typeof parsed.summary !== "string" ||
      !Array.isArray(parsed.strengths) ||
      !Array.isArray(parsed.improvements) ||
      !Array.isArray(parsed.objectives)
    ) {
      return null;
    }
    return {
      ...parsed,
      score: Math.max(0, Math.min(100, Math.round(parsed.score))),
      generatedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

function buildFallbackDebrief(input: {
  templateTitle: string;
  messageCount: number;
}): ScenarioDebrief {
  const score = input.messageCount >= 4 ? 72 : input.messageCount >= 2 ? 58 : 45;
  return {
    score,
    summary:
      input.messageCount >= 2
        ? `You completed the ${input.templateTitle} simulation with a focused exchange. Review the objectives below and run another scenario to sharpen your approach.`
        : `The ${input.templateTitle} simulation ended quickly. Try a longer run to practice objection handling and structured responses.`,
    strengths: [
      input.messageCount >= 2
        ? "Engaged with the scenario instead of exiting immediately"
        : "Started the simulation workflow",
    ],
    improvements: [
      "Ask clarifying questions before responding to pushback",
      "Anchor answers in business outcomes and measurable impact",
    ],
    objectives: [],
    generatedAt: new Date().toISOString(),
  };
}

export async function generateScenarioDebrief(input: {
  scenarioSessionId: string;
  organizationId: string;
  userId: string;
}): Promise<ScenarioDebrief> {
  const row = await getScenarioSessionForUser(input);
  if (!row) {
    throw new Error("Scenario session not found");
  }

  const template = getScenarioTemplateById(row.templateId);
  if (!template) {
    throw new Error("Scenario template not found");
  }

  const messages = row.talkSessionId
    ? await db
        .select({
          role: employeeSessionMessage.role,
          content: employeeSessionMessage.content,
        })
        .from(employeeSessionMessage)
        .where(eq(employeeSessionMessage.sessionId, row.talkSessionId))
        .orderBy(employeeSessionMessage.sequence)
    : [];

  const transcript = messages
    .filter((message) => message.role === "user" || message.role === "assistant")
    .map((message) => `${message.role}: ${message.content}`)
    .join("\n");

  const employee = row.employee;
  const talkContext = await getEmployeeTalkContext(
    input.organizationId,
    row.employeeId,
  );

  if (!talkContext) {
    throw new Error("Employee talk context not found");
  }

  const apiConfig = await resolveBrainApiConfig({
    provider: talkContext.brainProvider,
    configuredModel: talkContext.brainModel,
    organizationId: input.organizationId,
  });

  const debriefPrompt = [
    "You are an enterprise workforce simulation coach.",
    "Return ONLY valid JSON with this shape:",
    '{"score":number,"summary":string,"strengths":string[],"improvements":string[],"objectives":[{"id":string,"label":string,"met":boolean,"note":string}]}',
    `Scenario template: ${template.id}`,
    `Employee role: ${employee.role}`,
    `User role in simulation: ${template.userRole}`,
    "Objectives to evaluate:",
    ...template.objectives.map(
      (objective) => `- ${objective.id}: ${objective.label}`,
    ),
    "Transcript:",
    transcript || "(no transcript — session ended immediately)",
  ].join("\n");

  let debrief: ScenarioDebrief | null = null;

  try {
    const raw = await collectTalkBrainResponse({
      brainProvider: talkContext.brainProvider,
      model: apiConfig.model,
      systemPrompt:
        "Produce concise, executive-grade debrief JSON. Score 0-100. Be fair but demanding.",
      messages: [{ role: "user", content: debriefPrompt }],
      temperature: 0.2,
      maxTokens: 900,
    });
    debrief = parseDebriefJson(raw);
  } catch {
    debrief = null;
  }

  if (!debrief) {
    debrief = buildFallbackDebrief({
      templateTitle: template.id.replaceAll("_", " "),
      messageCount: messages.length,
    });
    debrief.objectives = template.objectives.map((objective) => ({
      id: objective.id,
      label: objective.label,
      met: messages.length >= 3,
      note: messages.length >= 3 ? "Partial evidence in transcript" : "Not enough dialogue to assess",
    }));
  } else if (debrief.objectives.length === 0) {
    debrief.objectives = template.objectives.map((objective) => ({
      id: objective.id,
      label: objective.label,
      met: false,
    }));
  }

  await db
    .update(employeeScenarioSession)
    .set({
      debrief,
      status: "debrief_ready",
      metrics: {
        ...(row.metrics ?? {}),
        talkEndedAt: new Date().toISOString(),
      },
    })
    .where(eq(employeeScenarioSession.id, input.scenarioSessionId));

  return debrief;
}

export async function markScenarioDebriefViewed(input: {
  scenarioSessionId: string;
  organizationId: string;
  userId: string;
}): Promise<void> {
  const row = await getScenarioSessionForUser(input);
  if (!row) {
    throw new Error("Scenario session not found");
  }

  await db
    .update(employeeScenarioSession)
    .set({
      status: "completed",
      metrics: {
        ...(row.metrics ?? {}),
        debriefViewedAt: new Date().toISOString(),
      },
    })
    .where(eq(employeeScenarioSession.id, input.scenarioSessionId));
}

export async function recordScenarioUpgradeClick(input: {
  scenarioSessionId: string;
  organizationId: string;
  userId: string;
}): Promise<void> {
  const row = await getScenarioSessionForUser(input);
  if (!row) {
    return;
  }

  await db
    .update(employeeScenarioSession)
    .set({
      metrics: {
        ...(row.metrics ?? {}),
        upgradeClickedAt: new Date().toISOString(),
      },
    })
    .where(eq(employeeScenarioSession.id, input.scenarioSessionId));
}
