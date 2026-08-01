/**
 * Server-contract smoke for Talk (no browser / Anam).
 *
 * Requires DATABASE_URL. Optional: TALK_VERIFY_EMPLOYEE_ID + TALK_VERIFY_ORG_ID.
 */
import { eq } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { executeAgentTool } from "@/features/agent-tools/services/execute-agent-tool";
import { assertTalkMinutesBudget } from "@/features/billing/services/assert-talk-minutes-budget";
import { loadEnvFiles } from "@/shared/config/load-env-files";
import { db } from "@/shared/db/client";
import { buildTalkBrainRequest } from "./services/build-talk-brain-request";
import { getEmployeeTalkContext } from "./services/get-employee-talk-context";
import { completeEmployeeSession } from "./services/record-employee-session";

loadEnvFiles();

async function resolveSampleEmployee(): Promise<{
  organizationId: string;
  employeeId: string;
}> {
  const employeeId = process.env.TALK_VERIFY_EMPLOYEE_ID?.trim();
  const organizationId = process.env.TALK_VERIFY_ORG_ID?.trim();

  if (employeeId && organizationId) {
    return { employeeId, organizationId };
  }

  const [employee] = await db.select().from(digitalEmployee).limit(1);
  if (!employee) {
    throw new Error(
      "No digital employees found. Set TALK_VERIFY_EMPLOYEE_ID and TALK_VERIFY_ORG_ID.",
    );
  }

  return {
    employeeId: employee.id,
    organizationId: employee.organizationId,
  };
}

async function verifyTalkSmoke(): Promise<void> {
  const { organizationId, employeeId } = await resolveSampleEmployee();

  const context = await getEmployeeTalkContext(organizationId, employeeId);
  if (!context) {
    throw new Error(`getEmployeeTalkContext returned null for ${employeeId}`);
  }

  const brainBuild = await buildTalkBrainRequest({
    organizationId,
    employeeId,
    messages: [{ role: "user", content: "Talk smoke verification ping" }],
  });
  if (!brainBuild.config?.model || !brainBuild.config.systemPrompt.trim()) {
    throw new Error("buildTalkBrainRequest returned incomplete config");
  }

  const denied = await executeAgentTool({
    toolName: "__smoke_disabled_tool__",
    argumentsJson: "{}",
    context: {
      organizationId,
      employeeId,
      enabledToolSlugs: context.enabledToolSlugs ?? [],
    },
  });
  if (
    !denied.content.includes("not enabled") &&
    !denied.content.includes("not enabled for this digital employee")
  ) {
    throw new Error(
      `Tool gate failed: expected denial, got: ${denied.content.slice(0, 200)}`,
    );
  }

  const budget = await assertTalkMinutesBudget({ organizationId });
  if (!budget.ok && !budget.message.includes("Talk budget")) {
    throw new Error(`assertTalkMinutesBudget unexpected: ${budget.message}`);
  }

  // Contract: abandon rejects unknown session with a clear error.
  try {
    await completeEmployeeSession({
      sessionId: "00000000-0000-4000-8000-000000000000",
      organizationId,
      userId: "talk-smoke-verify",
    });
    throw new Error("completeEmployeeSession should reject unknown session id");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes("Session not found")) {
      throw error;
    }
  }

  const [employeeRow] = await db
    .select({ id: digitalEmployee.id })
    .from(digitalEmployee)
    .where(eq(digitalEmployee.id, employeeId))
    .limit(1);
  if (!employeeRow) {
    throw new Error("Employee missing after smoke checks");
  }

  console.log("Talk smoke: context OK");
  console.log(`Employee: ${context.name} (${context.id})`);
  console.log(`Brain model: ${brainBuild.config.model}`);
  console.log("Talk smoke: tool gate OK");
  console.log(
    `Talk smoke: budget OK (${budget.ok ? "within limit" : "limit reached"})`,
  );
  console.log("Talk smoke: abandon contract OK");
  console.log("Talk smoke verification: OK");
}

verifyTalkSmoke().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error("Talk smoke verification failed:", message);
  process.exit(1);
});
