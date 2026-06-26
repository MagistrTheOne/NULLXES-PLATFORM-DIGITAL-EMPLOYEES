"use server";

import { requireWorkspacePermissionOrThrowMessage } from "@/features/workspace";
import { transcribeVoiceMessage } from "../services/transcribe-voice-message";

export type TranscribeVoiceMessageResult =
  | { ok: true; transcript: string }
  | { ok: false; message: string };

export async function transcribeVoiceMessageAction(
  formData: FormData,
): Promise<TranscribeVoiceMessageResult> {
  try {
    await requireWorkspacePermissionOrThrowMessage("canOperateEmployees");

    const audio = formData.get("audio");
    if (!(audio instanceof Blob) || audio.size === 0) {
      return { ok: false, message: "No audio provided" };
    }

    const transcript = await transcribeVoiceMessage(audio);
    return { ok: true, transcript };
  } catch (error: unknown) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Transcription failed",
    };
  }
}
