import { eq } from "drizzle-orm";
import type { SessionProviderConfigPayload } from "@/entities/provider-config";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { employeeProviderConfig } from "@/entities/provider-config/schema";
import { employeeRuntime } from "@/entities/runtime/schema";
import { provisionXaiVoiceForEmployee } from "@/features/xai-voice/services/provision-xai-voice-for-employee";
import { db } from "@/shared/db/client";
import { loadEnvFiles } from "@/shared/config/load-env-files";
import { isXaiVoiceConfigured } from "@/shared/config/xai-voice-env";

loadEnvFiles();

async function main(): Promise<void> {
  if (!isXaiVoiceConfigured()) {
    console.log("xai-voice:backfill skipped — XAI_API_KEY is not set");
    return;
  }

  const employees = await db
    .select({
      id: digitalEmployee.id,
      organizationId: digitalEmployee.organizationId,
      name: digitalEmployee.name,
      role: digitalEmployee.role,
      systemPrompt: employeeRuntime.systemPrompt,
      sessionConfig: employeeProviderConfig.config,
    })
    .from(digitalEmployee)
    .innerJoin(employeeRuntime, eq(employeeRuntime.employeeId, digitalEmployee.id))
    .innerJoin(
      employeeProviderConfig,
      eq(employeeProviderConfig.employeeId, digitalEmployee.id),
    )
    .where(eq(employeeProviderConfig.providerType, "session"));

  let provisioned = 0;
  let skipped = 0;

  for (const row of employees) {
    const session = row.sessionConfig as SessionProviderConfigPayload;
    if (session.xaiVoiceEnabled) {
      skipped += 1;
      continue;
    }

    const result = await provisionXaiVoiceForEmployee({
      employeeId: row.id,
      organizationId: row.organizationId,
      name: row.name,
      role: row.role,
      systemPrompt: row.systemPrompt ?? "",
      bindConsoleAgent: false,
      enabled: true,
    });

    if (result.ok) {
      provisioned += 1;
    }
  }

  console.log(
    `xai-voice:backfill provisioned ${provisioned} employee(s), skipped ${skipped} already enabled`,
  );
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error("xai-voice:backfill failed:", message);
  process.exit(1);
});
