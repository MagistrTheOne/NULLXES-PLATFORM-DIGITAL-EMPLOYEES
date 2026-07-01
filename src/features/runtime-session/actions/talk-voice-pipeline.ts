"use server";

import { requireWorkspacePermissionOrThrowMessage } from "@/features/workspace";
import { trimTalkHistory } from "../lib/trim-talk-history";
import { buildTalkBrainRequest } from "../services/build-talk-brain-request";
import { getEmployeeTalkContext } from "../services/get-employee-talk-context";
import { collectTalkBrainResponse } from "../services/stream-talk-brain-response";
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
    const employee = await getEmployeeTalkContext(
      workspace.organization.id,
      employeeId,
    );

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
    const employee = await getEmployeeTalkContext(
      workspace.organization.id,
      employeeId,
    );

  if (!employee) {
    return { ok: false, message: "Employee not found" };
  }

  const lastMessage = messages.at(-1);
  if (!lastMessage || lastMessage.role !== "user") {
    return { ok: false, message: "No user message to process" };
  }

  try {
    const openAiMessages = trimTalkHistory(messages).map((message) => ({
      role: (message.role === "user" ? "user" : "assistant") as
        | "user"
        | "assistant",
      content: message.content,
    }));

    const brainRequest = await buildTalkBrainRequest({
      organizationId: workspace.organization.id,
      employeeId,
      messages: openAiMessages,
    });

    if (!brainRequest) {
      return { ok: false, message: "Employee brain is not configured" };
    }

    const replyText = await collectTalkBrainResponse({
      brainProvider: brainRequest.brainProvider,
      model: brainRequest.model,
      systemPrompt: brainRequest.systemPrompt,
      messages: openAiMessages,
      temperature: brainRequest.temperature,
      maxTokens: brainRequest.maxTokens,
    });

    const voiceMode = resolveTalkVoiceMode(employee);
    let pcmBase64: string | null = null;
    if (voiceMode === "elevenlabs" && employee.voiceId) {
      const pcm = await synthesizeTalkVoicePcm(employee.voiceId, replyText);
      pcmBase64 = Buffer.from(pcm).toString("base64");
    }

    return {
      ok: true,
      replyText,
      voiceMode,
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
