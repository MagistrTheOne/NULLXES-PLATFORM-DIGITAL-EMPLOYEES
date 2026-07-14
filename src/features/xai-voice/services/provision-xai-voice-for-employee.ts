import type { SessionProviderConfigPayload } from "@/entities/provider-config";
import { mergeProviderConfig } from "@/features/provider-provisioning/services/update-provider-config";
import { buildTalkSessionBrainCache } from "@/features/runtime-session/services/build-talk-session-brain-cache";
import { composeSeedXaiVoiceSystemPrompt } from "@/features/xai-voice/lib/compose-xai-voice-system-prompt";
import { isXaiVoiceConfigured } from "@/shared/config/xai-voice-env";

export type ProvisionXaiVoiceInput = {
  employeeId: string;
  organizationId: string;
  name: string;
  role: string;
  systemPrompt?: string;
  enabled?: boolean;
  voiceInstructions?: string | null;
  bindConsoleAgent?: boolean;
  consoleAgentId?: string | null;
  voice?: string;
};

export async function provisionXaiVoiceForEmployee(
  input: ProvisionXaiVoiceInput,
): Promise<{ ok: true } | { ok: false; reason: "not_configured" }> {
  if (!isXaiVoiceConfigured()) {
    return { ok: false, reason: "not_configured" };
  }

  const bindConsoleAgent = input.bindConsoleAgent ?? false;
  const enabled = input.enabled ?? true;

  let instructions = input.voiceInstructions?.trim() || null;

  if (!bindConsoleAgent && !instructions) {
    const brainCache = await buildTalkSessionBrainCache({
      organizationId: input.organizationId,
      employeeId: input.employeeId,
    });
    instructions =
      brainCache?.systemPromptBase ??
      composeSeedXaiVoiceSystemPrompt(input.name, input.role);
  }

  const patch: Partial<SessionProviderConfigPayload> = {
    xaiVoiceEnabled: enabled,
    xaiVoiceBindConsoleAgent: bindConsoleAgent,
  };

  if (bindConsoleAgent) {
    const agentId = input.consoleAgentId?.trim();
    if (agentId) {
      patch.xaiVoiceAgentId = agentId;
    }
    // Leave voice unset — console agent owns timbre + identity.
    if (input.voice?.trim()) {
      patch.xaiVoiceVoice = input.voice.trim();
    }
  } else {
    patch.xaiVoiceVoice = input.voice?.trim() || "eve";
    patch.xaiVoiceInstructions = instructions ?? undefined;
  }

  await mergeProviderConfig(input.employeeId, "session", patch);
  return { ok: true };
}
