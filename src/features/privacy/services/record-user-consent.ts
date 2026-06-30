import { headers } from "next/headers";
import { userConsent } from "@/entities/user-consent/schema";
import { db } from "@/shared/db/client";
import {
  PERSONAL_DATA_POLICY_URL,
  PERSONAL_DATA_POLICY_VERSION,
} from "../lib/personal-data-policy";

export async function recordUserConsent(input: {
  userId: string;
  organizationId?: string | null;
  consentType?: "personal_data_processing";
}): Promise<void> {
  const headerStore = await headers();
  const ipAddress =
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headerStore.get("x-real-ip") ??
    null;
  const userAgent = headerStore.get("user-agent");

  await db.insert(userConsent).values({
    userId: input.userId,
    organizationId: input.organizationId ?? null,
    consentType: input.consentType ?? "personal_data_processing",
    policyVersion: PERSONAL_DATA_POLICY_VERSION,
    policyUrl: PERSONAL_DATA_POLICY_URL,
    ipAddress,
    userAgent,
  });
}
