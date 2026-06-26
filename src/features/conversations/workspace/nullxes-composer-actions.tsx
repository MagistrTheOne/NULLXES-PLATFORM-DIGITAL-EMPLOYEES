"use client";

import { useCallback, useId, useRef } from "react";
import { ArrowUp, Mic, Paperclip } from "lucide-react";
import {
  FileInput,
  useAttachmentManagerState,
  useChannelStateContext,
  useMessageComposerContext,
  useMessageComposerController,
  useStateStore,
} from "stream-chat-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const attachmentConfigSelector = (state: {
  attachments: {
    acceptedFiles?: string[];
    maxNumberOfFilesPerMessage?: number;
  };
}) => ({
  acceptedFiles: state.attachments.acceptedFiles,
  maxNumberOfFilesPerMessage: state.attachments.maxNumberOfFilesPerMessage,
});

const cooldownSelector = (state: { cooldownRemaining?: number }) => ({
  cooldownRemaining: state.cooldownRemaining,
});

function useComposerCooldownActive(): boolean {
  const { channel } = useChannelStateContext();
  const { cooldownRemaining } = useStateStore(
    channel.cooldownTimer.state,
    cooldownSelector,
  );

  return (cooldownRemaining ?? 0) > 0;
}

export function NullxesAttachButton() {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const { channelCapabilities } = useChannelStateContext();
  const { textareaRef } = useMessageComposerContext();
  const messageComposer = useMessageComposerController();
  const { attachmentManager } = messageComposer;
  const { isUploadEnabled } = useAttachmentManagerState();
  const isCooldownActive = useComposerCooldownActive();
  const { acceptedFiles, maxNumberOfFilesPerMessage } = useStateStore(
    messageComposer.configState,
    attachmentConfigSelector,
  );

  const onFileChange = useCallback(
    (files: File[]) => {
      attachmentManager.uploadFiles(files);
      textareaRef.current?.focus();
    },
    [attachmentManager, textareaRef],
  );

  if (!channelCapabilities["upload-file"]) {
    return null;
  }

  const disabled = !isUploadEnabled || isCooldownActive;

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        disabled={disabled}
        className="size-9 shrink-0 text-white/45 hover:bg-white/4 hover:text-white disabled:opacity-30"
        aria-label="Attach file"
        onClick={() => inputRef.current?.click()}
      >
        <Paperclip className="size-4 stroke-[1.5]" />
      </Button>
      <FileInput
        ref={inputRef}
        id={inputId}
        accept={acceptedFiles?.join(",")}
        multiple={(maxNumberOfFilesPerMessage ?? 1) > 1}
        disabled={disabled}
        onFileChange={onFileChange}
        className="hidden"
        tabIndex={-1}
      />
    </>
  );
}

export function NullxesVoiceButton() {
  const { recordingController, asyncMessagesMultiSendEnabled } =
    useMessageComposerContext();
  const { attachments } = useAttachmentManagerState();
  const isRecording = Boolean(recordingController.recordingState);
  const hasVoiceAttachment = attachments.some(
    (attachment) => attachment.type === "voiceRecording",
  );
  const disabled =
    isRecording ||
    (!asyncMessagesMultiSendEnabled && hasVoiceAttachment);

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      disabled={disabled}
      onClick={() => {
        recordingController.recorder?.start();
      }}
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
