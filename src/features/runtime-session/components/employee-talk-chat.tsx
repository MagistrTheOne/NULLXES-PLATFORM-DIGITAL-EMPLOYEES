"use client";

import "stream-chat-react/css/index.css";
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
import { cn } from "@/lib/utils";
import type { Channel as StreamChannel } from "stream-chat";
import type { StreamChat } from "stream-chat";
import {
  Channel,
  Chat,
  MessageComposer,
  MessageList,
  Window,
} from "stream-chat-react";
import { ConversationsMessageUI } from "@/features/conversations/components/conversations-message-ui";
import { TalkMessageUI } from "./talk-message-ui";
import type { TalkChatCredentials } from "../services/create-talk-chat-session";
import { attachTalkChatPipeline } from "../lib/attach-talk-chat-pipeline";
import { useTalkAnam } from "../context/talk-anam-context";
import { registerTalkChatBridge, resetTalkChatReplyDedup } from "../lib/talk-reply-bridge";
import { resetTalkPipelineCoordinator, releaseTalkPipelineCoordinator } from "../lib/talk-pipeline-coordinator";
import { connectTalkChatSessionAction } from "../actions/connect-talk-chat-session";
import {
  connectTalkChatSession,
  releaseTalkChatMount,
  retainTalkChatMount,
} from "../lib/talk-chat-connection";
import type { TalkVoiceMode } from "../services/resolve-talk-voice-mode";
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

  componentDidCatch(): void {
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
  employeeName,
  threadId = null,
  brainModelLabel,
  employeeSessionId,
  isSessionLive,
  voiceMode,
  viewerName,
  viewerImage,
  embedded = false,
  surface = "talk",
}: {
  chatSession: TalkChatCredentials | null;
  employeeId: string;
  employeeName: string;
  threadId?: string | null;
  brainModelLabel?: string | null;
  employeeSessionId?: string;
  isSessionLive: boolean;
  voiceMode: TalkVoiceMode;
  viewerName?: string;
  viewerImage?: string | null;
  embedded?: boolean;
  surface?: "talk" | "conversations";
}) {
  const t = useTranslations("employees.talk.chat");
  const tConversations = useTranslations("conversations");
  const tTalk = useTranslations("employees.talk");
  const isConversationsSurface = surface === "conversations";
  const { getClient } = useTalkAnam();
  const [activeChatSession, setActiveChatSession] =
    useState<TalkChatCredentials | null>(chatSession);
  const [client, setClient] = useState<StreamChat | null>(null);
  const [channel, setChannel] = useState<StreamChannel | null>(null);
  const [uiState, setUiState] = useState<TalkChatUiState>("connecting");
  const [connectAttempt, setConnectAttempt] = useState(0);
  const [isClearingHistory, setIsClearingHistory] = useState(false);
  const connectGenerationRef = useRef(0);

  useEffect(() => {
    return () => {
      releaseTalkPipelineCoordinator(employeeId);
    };
  }, [employeeId]);

  useEffect(() => {
    setActiveChatSession(chatSession);
  }, [chatSession]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrapChatSession(): Promise<TalkChatCredentials | null> {
      if (activeChatSession) {
        return activeChatSession;
      }

      const result = await connectTalkChatSessionAction(employeeId, threadId);
      if (!result.ok) {
        throw new Error(result.message);
      }

      if (!cancelled) {
        setActiveChatSession(result.chatSession);
      }

      return result.chatSession;
    }

    const generation = connectGenerationRef.current + 1;
    connectGenerationRef.current = generation;

    retainTalkChatMount();

    async function connect(): Promise<void> {
      setUiState("connecting");
      setClient(null);
      setChannel(null);

      try {
        const sessionCredentials = await bootstrapChatSession();
        if (!sessionCredentials) {
          return;
        }

        const session = await connectTalkChatSession(sessionCredentials);

        if (cancelled || connectGenerationRef.current !== generation) {
          return;
        }

        setClient(session.client);
        setChannel(session.channel);
        setUiState("ready");
      } catch {
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
      if (activeChatSession?.apiKey) {
        releaseTalkChatMount(activeChatSession.apiKey);
      }
    };
  }, [
    activeChatSession,
    employeeId,
    threadId,
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
      registerTalkChatBridge({ employeeId: null });
      return;
    }

    registerTalkChatBridge({ employeeId });

    const detach = attachTalkChatPipeline({
      channel,
      employeeId,
      employeeSessionId,
      actorUserId: activeChatSession!.userId,
      isSessionLive,
      voiceMode,
      getAnamClient: getClient,
    });

    return () => {
      detach();
      registerTalkChatBridge({ employeeId: null });
    };
  }, [
    activeChatSession,
    channel,
    employeeId,
    employeeSessionId,
    getClient,
    isSessionLive,
    uiState,
    voiceMode,
  ]);

  const handleClearHistory = useCallback(async () => {
    if (!channel || isClearingHistory || !activeChatSession) {
      return;
    }

    setIsClearingHistory(true);
    try {
      await channel.truncate({
        user_id: activeChatSession.userId,
        hard_delete: true,
      });
      resetTalkChatReplyDedup();
      resetTalkPipelineCoordinator(employeeId);
    } catch {
      // UI already reflects the failed clear attempt.
    } finally {
      setIsClearingHistory(false);
    }
  }, [activeChatSession, channel, employeeId, isClearingHistory]);

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
      <div
        className={cn(
          "employee-talk-chat-surface relative flex h-full min-h-0 flex-1 flex-col overflow-hidden",
          isConversationsSurface && "conversations-chat-stream",
        )}
      >
        <Chat client={client} theme="str-chat__theme-dark">
          <Channel
            channel={channel}
            EmptyPlaceholder={
              <TalkChatEmptyState
                message={
                  isConversationsSurface ? tConversations("emptyChat") : t("empty")
                }
              />
            }
          >
            <Window>
              {!embedded ? (
                <div className="employee-talk-chat-header border-b border-white/10 px-4 py-3">
                  <div className="employee-talk-chat-header-actions">
                    <div className="flex min-w-0 flex-col">
                      <span className="text-[11px] font-medium tracking-[0.12em] text-white/50 uppercase">
                        {t("title")}
                      </span>
                      {brainModelLabel ? (
                        <span className="truncate text-[10px] text-white/30">
                          {brainModelLabel}
                        </span>
                      ) : null}
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
              ) : null}
              <div className="employee-talk-chat-messages relative min-h-0 min-w-0 flex-1">
                <MessageList
                  Message={() =>
                    isConversationsSurface ? (
                      <ConversationsMessageUI
                        agentDisplayName={employeeName}
                        viewerName={viewerName}
                        viewerImage={viewerImage}
                      />
                    ) : (
                      <TalkMessageUI
                        agentDisplayName={employeeName}
                        viewerName={viewerName}
                        viewerImage={viewerImage}
                      />
                    )
                  }
                  noGroupByUser
                />
              </div>
              {isConversationsSurface ? (
                <div className="conversations-composer-shell">
                  <MessageComposer
                    additionalTextareaProps={{
                      placeholder: tConversations("composerPlaceholder"),
                    }}
                    maxRows={6}
                    minRows={1}
                  />
                  <p className="conversations-composer-hint">
                    {tConversations("composerHint")}
                  </p>
                </div>
              ) : (
                <MessageComposer />
              )}
            </Window>
          </Channel>
        </Chat>
      </div>
    </TalkChatErrorBoundary>
  );
}
