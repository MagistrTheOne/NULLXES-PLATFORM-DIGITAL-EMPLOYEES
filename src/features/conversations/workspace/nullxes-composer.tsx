"use client";

import { useTranslations } from "next-intl";
import { TextareaComposer, useMessageComposerContext } from "stream-chat-react";
import { cn } from "@/lib/utils";
import {
  NullxesAttachButton,
  NullxesSendButton,
  NullxesVoiceButton,
} from "./nullxes-composer-actions";
import { NullxesVoiceRecorder } from "./nullxes-voice-recorder";
import type { NullxesWorkspaceSurface } from "./types";

export function NullxesComposerUI({
  surface,
  placeholder,
}: {
  surface: NullxesWorkspaceSurface;
  placeholder?: string;
}) {
  const t = useTranslations("conversations");
  const tChat = useTranslations("employees.talk.chat");
  const resolvedPlaceholder =
    placeholder ??
    (surface === "conversations"
      ? t("composerPlaceholder")
      : tChat("placeholder"));
  const { recordingController } = useMessageComposerContext();
  const isRecording = Boolean(recordingController.recordingState);

  if (isRecording) {
    return (
      <div
        className={cn(
          "flex shrink-0 flex-col items-center border-t border-white/8 bg-black px-6 py-5",
          surface === "conversations"
            ? "pb-6"
            : "pb-[max(1.25rem,env(safe-area-inset-bottom))]",
        )}
      >
        <NullxesVoiceRecorder />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 flex-col items-center border-t border-white/8 bg-black px-6 py-5",
        surface === "conversations" ? "pb-6" : "pb-[max(1.25rem,env(safe-area-inset-bottom))]",
      )}
    >
      <div
        className={cn(
          "flex w-full max-w-2xl items-end gap-2 rounded-full border border-white/8 bg-[#0a0a0a] px-3 py-2",
          surface === "talk" && "max-w-none rounded-2xl px-4 py-3",
        )}
      >
        <NullxesAttachButton />

        <div className="min-w-0 flex-1">
          <TextareaComposer
            minRows={1}
            maxRows={6}
            placeholder={resolvedPlaceholder}
            containerClassName="w-full"
            className="max-h-24 min-h-6 w-full resize-none border-0 bg-transparent px-2 py-2 text-sm leading-relaxed text-white caret-white outline-none placeholder:text-white/35"
          />
        </div>

        <NullxesVoiceButton />

        <NullxesSendButton />
      </div>

      {surface === "conversations" ? (
        <p className="mt-3 max-w-2xl text-center text-[10px] font-normal leading-relaxed text-white/28">
          {t("composerHint")}
        </p>
      ) : null}
    </div>
  );
}
