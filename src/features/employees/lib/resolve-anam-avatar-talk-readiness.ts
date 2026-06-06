import type { AvatarProviderConfigPayload } from "@/entities/provider-config";

export function resolveAnamPersonaVoiceId(
  avatarConfig: AvatarProviderConfigPayload | undefined,
): string | null {
  const metadata = avatarConfig?.providerMetadata;
  if (!metadata || typeof metadata !== "object") {
    return null;
  }

  if (typeof metadata.anamPersonaVoiceId === "string") {
    return metadata.anamPersonaVoiceId;
  }

  if (typeof metadata.voiceId === "string") {
    return metadata.voiceId;
  }

  return null;
}

export function isAnamAvatarTalkReady(
  avatarConfig: AvatarProviderConfigPayload | undefined,
): boolean {
  if (avatarConfig?.provisioningStatus !== "ready") {
    return false;
  }

  return Boolean(
    avatarConfig.avatarId &&
      avatarConfig.personaId &&
      avatarConfig.previewUrl &&
      resolveAnamPersonaVoiceId(avatarConfig),
  );
}

export function describeAnamAvatarTalkReadiness(
  avatarConfig: AvatarProviderConfigPayload | undefined,
): string {
  if (avatarConfig?.provisioningStatus === "failed") {
    return "Avatar provisioning failed. Re-run studio setup from the employee page.";
  }

  if (avatarConfig?.provisioningStatus !== "ready") {
    return "Avatar studio setup is still in progress.";
  }

  const missing: string[] = [];
  if (!avatarConfig.avatarId) {
    missing.push("avatar ID");
  }
  if (!avatarConfig.personaId) {
    missing.push("persona ID");
  }
  if (!avatarConfig.previewUrl) {
    missing.push("preview URL");
  }
  if (!resolveAnamPersonaVoiceId(avatarConfig)) {
    missing.push("Anam voice ID");
  }

  if (missing.length === 0) {
    return "Anam avatar or voice is not ready for this employee yet.";
  }

  return `Anam talk is missing: ${missing.join(", ")}. Complete avatar studio setup.`;
}
