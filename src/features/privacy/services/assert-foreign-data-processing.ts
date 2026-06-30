import { eq } from "drizzle-orm";
import { organization } from "@/entities/organization/schema";
import { db } from "@/shared/db/client";

export type ForeignDataProcessor =
  | "openai"
  | "stream"
  | "anam"
  | "elevenlabs";

export type ForeignProcessingCheck =
  | { allowed: true }
  | { allowed: false; processor: ForeignDataProcessor; message: string };

const PROCESSOR_LABELS: Record<ForeignDataProcessor, string> = {
  openai: "OpenAI",
  stream: "Stream Chat",
  anam: "Anam",
  elevenlabs: "ElevenLabs",
};

/**
 * RU-region organizations must not route personal data to foreign processors
 * without a separate legal basis. Block until sovereign routing is available.
 */
export async function checkForeignDataProcessingAllowed(
  organizationId: string,
  processor: ForeignDataProcessor,
): Promise<ForeignProcessingCheck> {
  const [org] = await db
    .select({ dataRegion: organization.dataRegion })
    .from(organization)
    .where(eq(organization.id, organizationId))
    .limit(1);

  if (org?.dataRegion !== "ru") {
    return { allowed: true };
  }

  const label = PROCESSOR_LABELS[processor];
  return {
    allowed: false,
    processor,
    message: `${label} is unavailable for RU-region workspaces. Personal data cannot be processed abroad under the current deployment profile.`,
  };
}

export async function assertForeignDataProcessingAllowed(
  organizationId: string,
  processor: ForeignDataProcessor,
): Promise<void> {
  const check = await checkForeignDataProcessingAllowed(organizationId, processor);
  if (!check.allowed) {
    throw new Error(check.message);
  }
}
