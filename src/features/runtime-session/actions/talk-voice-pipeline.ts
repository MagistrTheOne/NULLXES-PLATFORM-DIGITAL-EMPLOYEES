"use server";

import { requireWorkspacePermissionOrThrowMessage } from "@/features/workspace";
import { getEmployeeDetail } from "@/features/employees/services/get-employee-detail";
import { collectTalkBrainResponse } from "../services/stream-talk-brain-response";
import { getTalkRuntimeConfig } from "../services/get-talk-runtime-config";
import {
  resolveTalkVoiceMode,
  type TalkVoiceMode,
} from "../services/resolve-talk-voice-mode";
import { synthesizeTalkVoicePcm } from "../services/synthesize-talk-voice-pcm";

export type TalkPipelineMessage = {
  role: "user" | "persona";
  content: string;
};

export type ProcessTalkTurnResult =
  | {
      ok: true;
      replyText: string;
      voiceMode: TalkVoiceMode;
      pcmBase64: string | null;
    }
  | { ok: false; message: string };

export type SynthesizeTalkVoiceResult =
  | { ok: true; pcmBase64: string }
  | { ok: false; message: string };

export async function synthesizeTalkVoiceAction(
  employeeId: string,
  replyText: string,
): Promise<SynthesizeTalkVoiceResult> {
  try {
    const workspace = await requireWorkspacePermissionOrThrowMessage(
      "canOperateEmployees",
    );
    const employee = await getEmployeeDetail(workspace.organization.id, employeeId);

  if (!employee?.voiceId) {
    return { ok: false, message: "Employee voice is not configured" };
  }

  if (resolveTalkVoiceMode(employee) !== "elevenlabs") {
    return { ok: false, message: "ElevenLabs voice is not enabled for this employee" };
  }

  try {
    const pcm = await synthesizeTalkVoicePcm(employee.voiceId, replyText);
    return { ok: true, pcmBase64: Buffer.from(pcm).toString("base64") };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "ElevenLabs synthesis failed";
    return { ok: false, message };
  }
  } catch (error: unknown) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Access denied",
    };
  }
}

export async function processTalkTurnAction(
  employeeId: string,
  messages: TalkPipelineMessage[],
): Promise<ProcessTalkTurnResult> {
  try {
    const workspace = await requireWorkspacePermissionOrThrowMessage(
      "canOperateEmployees",
    );
    const config = await getTalkRuntimeConfig(workspace.organization.id, employeeId);

  if (!config) {
    return { ok: false, message: "Employee not found" };
  }

  const lastMessage = messages.at(-1);
  if (!lastMessage || lastMessage.role !== "user") {
    return { ok: false, message: "No user message to process" };
  }

  try {
    const openAiMessages = messages.map((message) => ({
      role: (message.role === "user" ? "user" : "assistant") as
        | "user"
        | "assistant",
      content: message.content,
    }));

    const replyText = await collectTalkBrainResponse({
      model: config.model,
      systemPrompt: config.systemPrompt,
      messages: openAiMessages,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
    });

    let pcmBase64: string | null = null;
    if (config.voiceMode === "elevenlabs" && config.voiceId) {
      const pcm = await synthesizeTalkVoicePcm(config.voiceId, replyText);
      pcmBase64 = Buffer.from(pcm).toString("base64");
    }

    return {
      ok: true,
      replyText,
      voiceMode: config.voiceMode,
      pcmBase64,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Talk voice pipeline failed";
    return { ok: false, message };
  }
  } catch (error: unknown) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Access denied",
    };
  }
}
