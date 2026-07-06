import { headers } from "next/headers";
import { userConsent } from "@/entities/user-consent/schema";
import { dbWithTransactions } from "@/shared/db/pool-client";
import {
  PERSONAL_DATA_POLICY_URL,
  PERSONAL_DATA_POLICY_VERSION,
} from "../lib/personal-data-policy";
import {
  TERMS_OF_SERVICE_URL,
  TERMS_OF_SERVICE_VERSION,
} from "../lib/terms-of-service-policy";

type UserConsentType = "personal_data_processing" | "terms_of_service";

function resolveConsentPolicy(consentType: UserConsentType): {
  policyVersion: string;
  policyUrl: string;
} {
  if (consentType === "terms_of_service") {
    return {
      policyVersion: TERMS_OF_SERVICE_VERSION,
      policyUrl: TERMS_OF_SERVICE_URL,
    };
  }

  return {
    policyVersion: PERSONAL_DATA_POLICY_VERSION,
    policyUrl: PERSONAL_DATA_POLICY_URL,
  };
}

export async function recordUserConsents(input: {
  userId: string;
  organizationId?: string | null;
  consentTypes: UserConsentType[];
}): Promise<void> {
  if (input.consentTypes.length === 0) {
    return;
  }

  const headerStore = await headers();
  const ipAddress =
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headerStore.get("x-real-ip") ??
    null;
  const userAgent = headerStore.get("user-agent");

  const rows = input.consentTypes.map((consentType) => {
    const policy = resolveConsentPolicy(consentType);
    return {
      userId: input.userId,
      organizationId: input.organizationId ?? null,
      consentType,
      policyVersion: policy.policyVersion,
      policyUrl: policy.policyUrl,
      ipAddress,
      userAgent,
    };
  });

  await dbWithTransactions.transaction(async (tx) => {
    await tx.insert(userConsent).values(rows);
  });
}

export async function recordUserConsent(input: {
  userId: string;
  organizationId?: string | null;
  consentType?: UserConsentType;
}): Promise<void> {
  await recordUserConsents({
    userId: input.userId,
    organizationId: input.organizationId,
    consentTypes: [input.consentType ?? "personal_data_processing"],
  });
}
