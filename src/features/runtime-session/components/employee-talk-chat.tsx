"use client";

import { Component, type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, MessageSquare, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { Channel as StreamChannel } from "stream-chat";
import type { StreamChat } from "stream-chat";
import {
  Channel,
  Chat,
  MessageComposer,
  MessageList,
  Window,
} from "stream-chat-react";
import type { TalkChatCredentials } from "../services/create-talk-chat-session";
import { attachTalkChatPipeline } from "../lib/attach-talk-chat-pipeline";
import { useTalkAnam } from "../context/talk-anam-context";
import { registerTalkChatBridge, resetTalkChatReplyDedup } from "../lib/talk-reply-bridge";
import type { TalkVoiceMode } from "../services/resolve-talk-voice-mode";
import {
  connectTalkChatSession,
  releaseTalkChatMount,
  retainTalkChatMount,
} from "../lib/talk-chat-connection";
type TalkChatUiState = "connecting" | "ready" | "unavailable";

function TalkChatEmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
      <MessageSquare className="size-10 stroke-[1.25] text-white/25" />
      <p className="max-w-[220px] text-sm leading-relaxed text-white/45">{message}</p>
    </div>
  );
}

function TalkChatFallback({
  state,
  onRetry,
  connectingLabel,
  unavailableLabel,
  retryLabel,
}: {
  state: Exclude<TalkChatUiState, "ready">;
  onRetry?: () => void;
  connectingLabel: string;
  unavailableLabel: string;
  retryLabel: string;
}) {
  return (
    <div className="employee-talk-chat-fallback flex h-full flex-col items-center justify-center gap-3 px-4 text-center">
      {state === "connecting" ? (
        <>
          <Loader2 className="size-4 animate-spin text-white/50" />
          <p className="text-sm text-white/50">{connectingLabel}</p>
        </>
      ) : (
        <>
          <p className="text-sm text-white/50">{unavailableLabel}</p>
          {onRetry ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-white/12 text-white/70"
              onClick={onRetry}
            >
              <RotateCcw className="size-3.5" />
              {retryLabel}
            </Button>
          ) : null}
        </>
      )}
    </div>
  );
}

class TalkChatErrorBoundary extends Component<
  {
    onError: () => void;
    children: ReactNode;
    unavailableLabel: string;
  },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: unknown): void {
    console.error("Talk chat UI error", error);
    this.props.onError();
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <TalkChatFallback
          state="unavailable"
          unavailableLabel={this.props.unavailableLabel}
          connectingLabel=""
          retryLabel=""
        />
      );
    }

    return this.props.children;
  }
}

export function EmployeeTalkChat({
  chatSession,
  employeeId,
  isSessionLive,
  voiceMode,
}: {
  chatSession: TalkChatCredentials;
  employeeId: string;
  isSessionLive: boolean;
  voiceMode: TalkVoiceMode;
}) {
  const t = useTranslations("employees.talk.chat");
  const tTalk = useTranslations("employees.talk");
  const { getClient } = useTalkAnam();
  const [client, setClient] = useState<StreamChat | null>(null);
  const [channel, setChannel] = useState<StreamChannel | null>(null);
  const [uiState, setUiState] = useState<TalkChatUiState>("connecting");
  const [connectAttempt, setConnectAttempt] = useState(0);
  const [isClearingHistory, setIsClearingHistory] = useState(false);
  const connectGenerationRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    const generation = connectGenerationRef.current + 1;
    connectGenerationRef.current = generation;

    retainTalkChatMount();

    async function connect(): Promise<void> {
      setUiState("connecting");
      setClient(null);
      setChannel(null);

      try {
        const session = await connectTalkChatSession(chatSession);

        if (cancelled || connectGenerationRef.current !== generation) {
          return;
        }

        setClient(session.client);
        setChannel(session.channel);
        setUiState("ready");
      } catch (connectError: unknown) {
        console.error("Talk chat connection failed", connectError);
        if (cancelled || connectGenerationRef.current !== generation) {
          return;
        }

        setClient(null);
        setChannel(null);
        setUiState("unavailable");
      }
    }

    void connect();

    return () => {
      cancelled = true;
      releaseTalkChatMount(chatSession.apiKey);
    };
  }, [
    chatSession.apiKey,
    chatSession.channelId,
    chatSession.channelType,
    chatSession.token,
    chatSession.userId,
    chatSession.userName,
    connectAttempt,
  ]);

  useEffect(() => {
    if (uiState !== "ready") {
      return;
    }

    const root = document.querySelector(".employee-talk-chat-panel");
    const textarea = root?.querySelector("textarea");
    if (textarea) {
      textarea.setAttribute("placeholder", t("placeholder"));
    }
  }, [uiState, t]);

  useEffect(() => {
    if (uiState !== "ready" || !channel) {
      registerTalkChatBridge({ channel: null, botUserId: "" });
      return;
    }

    const botUserId = `digital-employee-${employeeId}`;
    registerTalkChatBridge({ channel, botUserId });

    const detach = attachTalkChatPipeline({
      channel,
      employeeId,
      actorUserId: chatSession.userId,
      isSessionLive,
      voiceMode,
      getAnamClient: getClient,
    });

    return () => {
      detach();
      registerTalkChatBridge({ channel: null, botUserId: "" });
    };
  }, [
    channel,
    chatSession.userId,
    employeeId,
    getClient,
    isSessionLive,
    uiState,
    voiceMode,
  ]);

  const handleClearHistory = useCallback(async () => {
    if (!channel || isClearingHistory) {
      return;
    }

    setIsClearingHistory(true);
    try {
      await channel.truncate({
        user_id: chatSession.userId,
        hard_delete: true,
      });
      resetTalkChatReplyDedup();
    } catch (clearError: unknown) {
      console.error("Failed to clear talk chat history", clearError);
    } finally {
      setIsClearingHistory(false);
    }
  }, [channel, chatSession.userId, isClearingHistory]);

  if (uiState !== "ready" || !client || !channel) {
    return (
      <TalkChatFallback
        state={uiState === "ready" ? "connecting" : uiState}
        connectingLabel={tTalk("connecting")}
        unavailableLabel={t("unavailable")}
        retryLabel={t("retry")}
        onRetry={
          uiState === "unavailable"
            ? () => setConnectAttempt((current) => current + 1)
            : undefined
        }
      />
    );
  }

  return (
    <TalkChatErrorBoundary
      onError={() => setUiState("unavailable")}
      unavailableLabel={t("unavailable")}
    >
      <div className="employee-talk-chat-surface relative h-full min-h-0">
        <Chat client={client} theme="str-chat__theme-dark">
          <Channel channel={channel}>
            <Window>
              <div className="employee-talk-chat-header border-b border-white/10 px-4 py-3">
                <div className="employee-talk-chat-header-actions">
                  <div className="min-w-0">
                    <span className="text-[11px] font-medium tracking-[0.12em] text-white/50 uppercase">
                      {t("title")}
                    </span>
                    <p className="mt-0.5 text-[10px] text-white/35">{t("brainNote")}</p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={isClearingHistory}
                        className="h-7 gap-1.5 px-2 text-[11px] text-white/45 hover:bg-white/6 hover:text-white/70"
                      >
                        <Trash2 className="size-3.5" />
                        {t("clearHistory")}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="border-white/10 bg-[#111111] text-white">
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t("clearHistoryTitle")}</AlertDialogTitle>
                        <AlertDialogDescription className="text-white/60">
                          {t("clearHistoryDescription")}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="border-white/12 bg-transparent text-white/70 hover:bg-white/6 hover:text-white">
                          {t("clearHistoryCancel")}
                        </AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-white text-black hover:bg-white/90"
                          onClick={() => {
                            void handleClearHistory();
                          }}
                        >
                          {isClearingHistory ? t("clearHistoryClearing") : t("clearHistoryConfirm")}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              <div className="employee-talk-chat-messages relative min-h-0 flex-1">
                <TalkChatEmptyOverlay channel={channel} emptyMessage={t("empty")} />
                <MessageList />
              </div>
              <MessageComposer />
            </Window>
          </Channel>
        </Chat>
      </div>
    </TalkChatErrorBoundary>
  );
}

function TalkChatEmptyOverlay({
  channel,
  emptyMessage,
}: {
  channel: StreamChannel;
  emptyMessage: string;
}) {
  const [isEmpty, setIsEmpty] = useState(
    () => (channel.state.messages?.length ?? 0) === 0,
  );

  useEffect(() => {
    const syncEmpty = () => {
      setIsEmpty((channel.state.messages?.length ?? 0) === 0);
    };

    syncEmpty();
    channel.on("message.new", syncEmpty);
    channel.on("message.deleted", syncEmpty);

    return () => {
      channel.off("message.new", syncEmpty);
      channel.off("message.deleted", syncEmpty);
    };
  }, [channel]);

  if (!isEmpty) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
      <TalkChatEmptyState message={emptyMessage} />
    </div>
  );
}
