"use server";

import { revalidatePath } from "next/cache";
import type { OrganizationProvider } from "@/entities/organization-provider-credential";
import { requireWorkspacePermissionOrThrowMessage } from "@/features/workspace";
import {
  removeOrganizationProviderKey,
  setOrganizationProviderKey,
} from "../services/organization-provider-credentials";

const SUPPORTED_PROVIDERS: OrganizationProvider[] = [
  "nullxes",
  "openai",
  "anthropic",
  "google",
];

function isSupportedProvider(value: string): value is OrganizationProvider {
  return SUPPORTED_PROVIDERS.includes(value as OrganizationProvider);
}

export async function setProviderCredentialAction(input: {
  provider: string;
  apiKey: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    if (!isSupportedProvider(input.provider)) {
      return { ok: false, message: "Unsupported provider." };
    }

    const apiKey = input.apiKey.trim();
    if (apiKey.length < 12) {
      return { ok: false, message: "Enter a valid API key." };
    }

    const workspace = await requireWorkspacePermissionOrThrowMessage(
      "canManageOrganization",
    );

    await setOrganizationProviderKey({
      organizationId: workspace.organization.id,
      provider: input.provider,
      apiKey,
      createdByUserId: workspace.user.id,
    });

    revalidatePath("/settings");
    return { ok: true };
  } catch (error: unknown) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Failed to save key.",
    };
  }
}

export async function removeProviderCredentialAction(input: {
  provider: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    if (!isSupportedProvider(input.provider)) {
      return { ok: false, message: "Unsupported provider." };
    }

    const workspace = await requireWorkspacePermissionOrThrowMessage(
      "canManageOrganization",
    );

    await removeOrganizationProviderKey({
      organizationId: workspace.organization.id,
      provider: input.provider,
    });

    revalidatePath("/settings");
    return { ok: true };
  } catch (error: unknown) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Failed to remove key.",
    };
  }
}
