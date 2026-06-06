"use server";

import { requireAuth } from "@/features/auth/services/require-auth";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import { getEmployeeDetail } from "@/features/employees/services/get-employee-detail";
import { generateTalkBrainResponse } from "../services/generate-talk-brain-response";
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

export async function processTalkTurnAction(
  employeeId: string,
  messages: TalkPipelineMessage[],
): Promise<ProcessTalkTurnResult> {
  const session = await requireAuth();
  const workspace = await ensureWorkspace(session.user.id, session.user.name);
  const employee = await getEmployeeDetail(workspace.organization.id, employeeId);

  if (!employee) {
    return { ok: false, message: "Employee not found" };
  }

  const lastMessage = messages.at(-1);
  if (!lastMessage || lastMessage.role !== "user") {
    return { ok: false, message: "No user message to process" };
  }

  const voiceMode = resolveTalkVoiceMode(employee);
  const model = employee.brainModel ?? "gpt-4o";
  const systemPrompt =
    employee.systemPrompt.trim() ||
    `You are ${employee.name}, a ${employee.role}. Respond naturally and concisely in conversation.`;

  try {
    const openAiMessages = messages.map((message) => ({
      role: (message.role === "user" ? "user" : "assistant") as
        | "user"
        | "assistant",
      content: message.content,
    }));

    const replyText = await generateTalkBrainResponse({
      model,
      systemPrompt,
      messages: openAiMessages,
    });

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
}
