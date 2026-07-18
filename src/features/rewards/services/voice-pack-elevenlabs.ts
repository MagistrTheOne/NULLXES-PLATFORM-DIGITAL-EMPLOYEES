import "server-only";

import { eq } from "drizzle-orm";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { rewardDefinition } from "@/entities/reward";
import {
  getVoicePack,
  parseVoicePackCache,
  serializeVoicePackCache,
  voicePackEnvKey,
} from "@/features/rewards/lib/voice-pack-catalog";
import type { CharacterGender } from "@/features/hq/lib/resolve-character-gender";
import {
  getElevenLabsApiKey,
  hasElevenLabsCredentials,
} from "@/shared/config/provider-env";
import { db } from "@/shared/db/client";
import { ELEVENLABS_VOICE_MODEL_ID } from "@/features/provider-provisioning/types";
import { mergeProviderConfig } from "@/features/provider-provisioning/services/update-provider-config";

/**
 * Resolve (or Voice-Design) an ElevenLabs voice_id for a reward pack + gender.
 * Caches ids on reward_definition.boost_label as el_f:/el_m:.
 */
export async function resolveVoicePackElevenLabsId(input: {
  rewardSlug: string;
  gender: CharacterGender;
}): Promise<{ ok: true; voiceId: string } | { ok: false; message: string }> {
  const pack = getVoicePack(input.rewardSlug);
  if (!pack) {
    return { ok: false, message: `Unknown voice pack: ${input.rewardSlug}` };
  }

  const envId = process.env[voicePackEnvKey(pack.slug, input.gender)]?.trim();
  if (envId) {
    return { ok: true, voiceId: envId };
  }

  const [row] = await db
    .select({
      boostLabel: rewardDefinition.boostLabel,
    })
    .from(rewardDefinition)
    .where(eq(rewardDefinition.slug, pack.slug))
    .limit(1);

  const cached = parseVoicePackCache(row?.boostLabel);
  const hit = cached[input.gender];
  if (hit) {
    return { ok: true, voiceId: hit };
  }

  if (!hasElevenLabsCredentials()) {
    return { ok: false, message: "ELEVENLABS_API_KEY is not configured" };
  }

  const apiKey = getElevenLabsApiKey();
  if (!apiKey) {
    return { ok: false, message: "ELEVENLABS_API_KEY is not configured" };
  }

  try {
    const client = new ElevenLabsClient({ apiKey });
    const description = pack.prompts[input.gender];
    const design = await client.textToVoice.design({
      voiceDescription: description,
      autoGenerateText: true,
      modelId: "eleven_ttv_v3",
      guidanceScale: 5,
    });

    const preview = design.previews?.[0];
    if (!preview?.generatedVoiceId) {
      return {
        ok: false,
        message: "ElevenLabs Voice Design returned no previews",
      };
    }

    const created = await client.textToVoice.create({
      voiceName: `NULLXES ${pack.name} (${input.gender})`,
      voiceDescription: description,
      generatedVoiceId: preview.generatedVoiceId,
      labels: {
        gender: input.gender,
        pack: pack.slug,
        product: "nullxes_voice_pack",
      },
    });

    const voiceId = created.voiceId;
    if (!voiceId) {
      return { ok: false, message: "ElevenLabs create voice returned no id" };
    }

    const nextCache = { ...cached, [input.gender]: voiceId };
    await db
      .update(rewardDefinition)
      .set({
        boostLabel: serializeVoicePackCache(nextCache),
        comingSoon: false,
        updatedAt: new Date(),
      })
      .where(eq(rewardDefinition.slug, pack.slug));

    return { ok: true, voiceId };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "ElevenLabs Voice Design failed",
    };
  }
}

/** Apply a resolved pack voice onto the employee's Talk session config. */
export async function applyVoicePackToEmployee(input: {
  employeeId: string;
  organizationId: string;
  voiceId: string;
  rewardSlug: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    await mergeProviderConfig(
      input.employeeId,
      "session",
      {
        voiceProvider: "elevenlabs",
        voiceId: input.voiceId,
        studioVoiceId: input.voiceId,
        modelId: ELEVENLABS_VOICE_MODEL_ID,
        providerResourceId: input.voiceId,
        provisioningStatus: "ready",
        failureReason: undefined,
        providerMetadata: {
          source: "reward_voice_pack",
          rewardSlug: input.rewardSlug,
          appliedAt: new Date().toISOString(),
        },
      },
      { organizationId: input.organizationId },
    );
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to apply voice pack to employee",
    };
  }
}
