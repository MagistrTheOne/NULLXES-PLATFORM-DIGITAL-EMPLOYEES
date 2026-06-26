"use client";

import { ArrowUp, Mic, Paperclip } from "lucide-react";
import { FileInput, useMessageComposerContext } from "stream-chat-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function NullxesAttachButton() {
  return (
    <FileInput>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="size-9 shrink-0 text-white/45 hover:bg-white/4 hover:text-white"
        aria-label="Attach file"
      >
        <Paperclip className="size-4 stroke-[1.5]" />
      </Button>
    </FileInput>
  );
}

export function NullxesVoiceButton({
  disabled,
  onClick,
}: {
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      disabled={disabled}
      onClick={onClick}
      className="size-9 shrink-0 text-white/45 hover:bg-white/4 hover:text-white disabled:opacity-30"
      aria-label="Voice message"
    >
      <Mic className="size-4 stroke-[1.5]" />
    </Button>
  );
}

export function NullxesSendButton({ className }: { className?: string }) {
  const { handleSubmit } = useMessageComposerContext();

  return (
    <Button
      type="button"
      size="icon-sm"
      onClick={() => {
        handleSubmit();
      }}
      className={cn(
        "size-9 shrink-0 rounded-full bg-white text-black hover:bg-white/90",
        className,
      )}
      aria-label="Send message"
    >
      <ArrowUp className="size-4 stroke-2" />
    </Button>
  );
}
