import type { ProviderProvisioningStatus } from "@/entities/provider-config";
import { isAnamAvatarTalkReady } from "./resolve-anam-avatar-talk-readiness";

type TalkReadinessInput = {
  avatarProvisioningStatus: ProviderProvisioningStatus;
  sessionProvisioningStatus: ProviderProvisioningStatus;
  avatarReady?: boolean;
};

export type TalkReadinessBlocker =
  | "avatar_pending"
  | "avatar_provisioning"
  | "avatar_failed"
  | "avatar_not_ready"
  | "session_pending"
  | "session_provisioning"
  | "session_failed"
  | "session_not_ready";

export function resolveTalkReadinessBlockers(
  input: TalkReadinessInput,
): TalkReadinessBlocker[] {
  const blockers: TalkReadinessBlocker[] = [];
  const avatarReady =
    input.avatarReady ??
    (input.avatarProvisioningStatus === "ready");

  if (!avatarReady) {
    if (input.avatarProvisioningStatus === "pending") {
      blockers.push("avatar_pending");
    } else if (input.avatarProvisioningStatus === "provisioning") {
      blockers.push("avatar_provisioning");
    } else if (input.avatarProvisioningStatus === "failed") {
      blockers.push("avatar_failed");
    } else {
      blockers.push("avatar_not_ready");
    }
  }

  if (input.sessionProvisioningStatus !== "ready") {
    if (input.sessionProvisioningStatus === "pending") {
      blockers.push("session_pending");
    } else if (input.sessionProvisioningStatus === "provisioning") {
      blockers.push("session_provisioning");
    } else if (input.sessionProvisioningStatus === "failed") {
      blockers.push("session_failed");
    } else {
      blockers.push("session_not_ready");
    }
  }

  return blockers;
}

export function isEmployeeTalkReadyFromStatuses(input: {
  avatarConfig?: {
    provisioningStatus?: ProviderProvisioningStatus;
    personaId?: string;
    avatarId?: string;
    providerMetadata?: Record<string, unknown>;
  };
  sessionProvisioningStatus: ProviderProvisioningStatus;
}): boolean {
  const avatarReady = isAnamAvatarTalkReady(input.avatarConfig);
  return avatarReady && input.sessionProvisioningStatus === "ready";
}

function readFailureReason(
  config: Record<string, unknown> | undefined,
): string | null {
  if (!config) {
    return null;
  }

  const reason = config.failureReason;
  return typeof reason === "string" && reason.trim().length > 0
    ? reason.trim()
    : null;
}

export function readProviderFailureReason(
  config: Record<string, unknown> | undefined,
): string | null {
  return readFailureReason(config);
}
