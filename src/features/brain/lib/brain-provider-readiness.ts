import type { BrainProvider } from "@/entities/digital-employee";
import type { OrganizationProvider } from "@/entities/organization-provider-credential";
import { resolveOrganizationProviderKey } from "@/features/provider-credentials";
import { hasNullxesApiCredentials } from "@/shared/nullxes-sdk";
import type {
  BrainProviderReadiness,
  BrainProviderReadinessMap,
} from "../types/brain-provider-readiness";
import { BRAIN_PROVIDERS } from "./brain-model-catalog";

export type { BrainProviderReadiness, BrainProviderReadinessMap };

function toOrganizationProvider(
  provider: BrainProvider,
): OrganizationProvider {
  return provider;
}

async function resolveProviderReadiness(
  provider: BrainProvider,
  organizationId?: string,
): Promise<BrainProviderReadiness> {
  if (provider === "nullxes") {
    if (hasNullxesApiCredentials()) {
      return "managed";
    }

    const key = await resolveOrganizationProviderKey(
      organizationId,
      "nullxes",
    );
    return key ? "ready" : "configure";
  }

  const key = await resolveOrganizationProviderKey(
    organizationId,
    toOrganizationProvider(provider),
  );
  return key ? "ready" : "configure";
}

/** Platform env + organization Provider API keys. */
export async function getBrainProviderReadinessMap(
  organizationId?: string,
): Promise<BrainProviderReadinessMap> {
  const entries = await Promise.all(
    BRAIN_PROVIDERS.map(async (provider) => {
      const readiness = await resolveProviderReadiness(
        provider,
        organizationId,
      );
      return [provider, readiness] as const;
    }),
  );

  return Object.fromEntries(entries) as BrainProviderReadinessMap;
}

/** Card can be selected in UI. Save still requires ready/managed credentials. */
export function isBrainProviderSelectable(
  _provider: BrainProvider,
  _readiness: BrainProviderReadiness,
): boolean {
  return true;
}

export function isBrainProviderConfigured(
  readiness: BrainProviderReadiness,
): boolean {
  return readiness === "ready" || readiness === "managed";
}
