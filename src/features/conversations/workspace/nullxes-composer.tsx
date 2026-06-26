"use client";

import { Mic } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  StartRecordingAudioButton,
  TextareaComposer,
} from "stream-chat-react";
import { cn } from "@/lib/utils";
import {
  NullxesAttachButton,
  NullxesSendButton,
} from "./nullxes-composer-actions";
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

  return (
    <div
      className={cn(
        "shrink-0 border-t border-white/8 bg-black px-6 py-5",
        surface === "conversations" ? "pb-6" : "pb-[max(1.25rem,env(safe-area-inset-bottom))]",
      )}
    >
      <div
        className={cn(
          "mx-auto flex w-full max-w-3xl items-end gap-2 rounded-full border border-white/8 bg-black px-3 py-2",
          surface === "talk" && "max-w-none rounded-2xl px-4 py-3",
        )}
      >
        <NullxesAttachButton />

        <div className="min-w-0 flex-1">
          <TextareaComposer
            minRows={1}
            maxRows={6}
            additionalTextareaProps={{
              placeholder: resolvedPlaceholder,
              className:
                "max-h-24 min-h-6 w-full resize-none border-0 bg-transparent px-2 py-2 text-sm leading-relaxed text-white outline-none placeholder:text-white/35",
            }}
          />
        </div>

        <StartRecordingAudioButton>
          <button
            type="button"
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-white/45 transition-colors hover:bg-white/4 hover:text-white"
            aria-label="Voice message"
          >
            <Mic className="size-4 stroke-[1.5]" />
          </button>
        </StartRecordingAudioButton>

        <NullxesSendButton />
      </div>

      {surface === "conversations" ? (
        <p className="mx-auto mt-3 max-w-3xl text-center text-[10px] font-normal leading-relaxed text-white/28">
          {t("composerHint")}
        </p>
      ) : null}
    </div>
  );
}
