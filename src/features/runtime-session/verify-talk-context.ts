import { eq } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { loadEnvFiles } from "@/shared/config/load-env-files";
import { db } from "@/shared/db/client";
import { buildTalkBrainRequest } from "./services/build-talk-brain-request";
import { getEmployeeTalkContext } from "./services/get-employee-talk-context";

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

async function verifyTalkContext(): Promise<void> {
  const { organizationId, employeeId } = await resolveSampleEmployee();

  const context = await getEmployeeTalkContext(organizationId, employeeId);
  if (!context) {
    throw new Error(`getEmployeeTalkContext returned null for ${employeeId}`);
  }

  const requiredFields = [
    "id",
    "name",
    "role",
    "organizationId",
    "canTalk",
    "systemPrompt",
    "temperature",
    "maxTokens",
  ] as const;

  for (const field of requiredFields) {
    if (context[field] === undefined) {
      throw new Error(`Talk context missing field: ${field}`);
    }
  }

  const [employeeRow] = await db
    .select({ id: digitalEmployee.id })
    .from(digitalEmployee)
    .where(eq(digitalEmployee.id, employeeId))
    .limit(1);

  if (!employeeRow) {
    throw new Error("Employee row missing after talk context load");
  }

  const brainBuild = await buildTalkBrainRequest({
    organizationId,
    employeeId,
    messages: [{ role: "user", content: "Talk context verification ping" }],
  });

  const brainRequest = brainBuild.config;
  if (!brainRequest) {
    throw new Error("buildTalkBrainRequest returned null");
  }

  if (!brainRequest.model || !brainRequest.systemPrompt.trim()) {
    throw new Error("buildTalkBrainRequest returned incomplete config");
  }

  console.log("Talk context loader: OK");
  console.log(`Employee: ${context.name} (${context.id})`);
  console.log(`canTalk: ${context.canTalk}`);
  console.log(`Brain model: ${brainRequest.model}`);
  console.log(`System prompt length: ${brainRequest.systemPrompt.length}`);
  console.log("Talk context verification: OK");
}

verifyTalkContext().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error("Talk context verification failed:", message);
  process.exit(1);
});
