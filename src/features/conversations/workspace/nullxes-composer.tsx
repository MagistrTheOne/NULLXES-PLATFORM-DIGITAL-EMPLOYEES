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
  const isConversations = surface === "conversations";

  if (isRecording) {
    return (
      <div
        className={cn(
          "flex shrink-0 flex-col items-center border-t border-white/8 bg-black",
          isConversations
            ? "px-3 py-2.5 pb-[max(0.65rem,env(safe-area-inset-bottom))] sm:px-4 sm:py-3"
            : "px-6 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]",
        )}
      >
        <NullxesVoiceRecorder />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 flex-col items-center border-t border-white/8 bg-black",
        isConversations
          ? "px-3 py-2.5 pb-[max(0.65rem,env(safe-area-inset-bottom))] sm:px-4 sm:py-3"
          : "px-6 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]",
      )}
    >
      <div
        className={cn(
          "flex w-full items-end gap-1.5 border border-white/8 bg-white/3 transition-colors focus-within:border-white/20",
          isConversations
            ? "max-w-none rounded-2xl px-2 py-1.5 sm:max-w-2xl sm:gap-2 sm:px-3 sm:py-2"
            : "max-w-none rounded-2xl px-4 py-3",
          !isConversations &&
            "focus-within:border-brand/50 focus-within:ring-1 focus-within:ring-brand/25",
        )}
      >
        <NullxesAttachButton />

        <div className="min-w-0 flex-1">
          <TextareaComposer
            minRows={1}
            maxRows={isConversations ? 4 : 6}
            placeholder={resolvedPlaceholder}
            containerClassName="w-full"
            className={cn(
              "w-full resize-none border-0 bg-transparent text-sm text-white caret-white outline-none placeholder:text-white/35",
              isConversations
                ? "max-h-20 min-h-5 px-1.5 py-1.5 leading-snug sm:px-2 sm:py-2 sm:leading-relaxed"
                : "max-h-24 min-h-6 px-2 py-2 leading-relaxed",
            )}
          />
        </div>

        <NullxesVoiceButton />

        <NullxesSendButton />
      </div>

      {isConversations ? (
        <p className="mt-1.5 hidden max-w-2xl text-center text-[10px] font-normal leading-relaxed text-white/28 sm:block">
          {t("composerHint")}
        </p>
      ) : null}
    </div>
  );
}
