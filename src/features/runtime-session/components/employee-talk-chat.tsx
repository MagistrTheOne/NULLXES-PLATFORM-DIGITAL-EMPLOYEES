"use client";

import "stream-chat-react/css/index.css";
import { Component, type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, RotateCcw, Trash2 } from "lucide-react";
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
import {
  NullxesConversationLayout,
  NullxesMessageList,
  NullxesStreamWorkspace,
} from "@/features/conversations/workspace";
import {
  Channel,
  Chat,
  MessageComposer,
  Window,
} from "stream-chat-react";
import type { Channel as StreamChannel } from "stream-chat";
import type { StreamChat } from "stream-chat";
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

function TalkChatFallback({
  state,
  onRetry,
  connectingLabel,
  unavailableLabel,
  retryLabel,
  detail,
}: {
  state: Exclude<TalkChatUiState, "ready">;
  onRetry?: () => void;
  connectingLabel: string;
  unavailableLabel: string;
  retryLabel: string;
  detail?: string | null;
}) {
  return (
    <div className="flex h-full min-h-48 flex-col items-center justify-center gap-3 px-4 text-center">
      {state === "connecting" ? (
        <>
          <Loader2 className="size-4 animate-spin text-white/50" />
          <p className="text-sm text-white/50">{connectingLabel}</p>
        </>
      ) : (
        <>
          <p className="text-sm text-white/50">{unavailableLabel}</p>
          {detail ? (
            <p className="max-w-md text-xs leading-5 text-white/35">{detail}</p>
          ) : null}
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
    onRetry: () => void;
    children: ReactNode;
    unavailableLabel: string;
    retryLabel: string;
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
          retryLabel={this.props.retryLabel}
          onRetry={() => {
            this.setState({ hasError: false });
            this.props.onRetry();
          }}
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
  employeeRole,
  threadId = null,
  brainModelLabel,
  employeeSessionId,
  scenarioSessionId,
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
  employeeRole?: string;
  threadId?: string | null;
  brainModelLabel?: string | null;
  employeeSessionId?: string;
  scenarioSessionId?: string;
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
  const [connectError, setConnectError] = useState<string | null>(null);
  const [connectAttempt, setConnectAttempt] = useState(0);
  const [isClearingHistory, setIsClearingHistory] = useState(false);
  const connectGenerationRef = useRef(0);
  const uiStateRef = useRef(uiState);
  uiStateRef.current = uiState;

  useEffect(() => {
    return () => {
      releaseTalkPipelineCoordinator(employeeId);
    };
  }, [employeeId]);

  useEffect(() => {
    setActiveChatSession(chatSession);
  }, [chatSession]);

  // Mobile: retry after returning to the tab if Stream previously failed.
  useEffect(() => {
    function onVisibility(): void {
      if (
        document.visibilityState === "visible" &&
        uiStateRef.current === "unavailable"
      ) {
        setConnectAttempt((current) => current + 1);
      }
    }

    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

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
      setConnectError(null);
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
      } catch (error: unknown) {
        if (cancelled || connectGenerationRef.current !== generation) {
          return;
        }

        setClient(null);
        setChannel(null);
        setConnectError(
          error instanceof Error ? error.message : t("unavailable"),
        );
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
    if (uiState !== "ready" || !channel) {
      registerTalkChatBridge({ employeeId: null, channelId: null });
      return;
    }

    registerTalkChatBridge({
      employeeId,
      channelId: activeChatSession?.channelId ?? null,
    });

    const detach = attachTalkChatPipeline({
      channel,
      employeeId,
      employeeSessionId,
      scenarioSessionId,
      actorUserId: activeChatSession!.userId,
      isSessionLive,
      voiceMode,
      getAnamClient: getClient,
    });

    return () => {
      detach();
      registerTalkChatBridge({ employeeId: null, channelId: null });
    };
  }, [
    activeChatSession,
    channel,
    employeeId,
    employeeSessionId,
    scenarioSessionId,
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
        detail={connectError}
        onRetry={
          uiState === "unavailable"
            ? () => setConnectAttempt((current) => current + 1)
            : undefined
        }
      />
    );
  }

  const streamWorkspaceConfig = {
    surface,
    agentDisplayName: employeeName,
    agentRole: employeeRole,
    viewerName,
    viewerImage,
    emptyMessage: isConversationsSurface ? tConversations("emptyChat") : t("empty"),
    composerPlaceholder: isConversationsSurface
      ? tConversations("composerPlaceholder")
      : undefined,
  } as const;

  return (
    <TalkChatErrorBoundary
      onError={() => setUiState("unavailable")}
      onRetry={() => setConnectAttempt((current) => current + 1)}
      unavailableLabel={t("unavailable")}
      retryLabel={t("retry")}
    >
      <NullxesStreamWorkspace config={streamWorkspaceConfig}>
        <Chat client={client} theme="str-chat__theme-dark">
          <Channel channel={channel}>
            <Window>
              <NullxesConversationLayout>
                {!embedded ? (
                  <div className="shrink-0 border-b border-white/8 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 flex-col gap-0.5">
                        <span className="truncate text-sm font-medium text-white">
                          {employeeName}
                        </span>
                        {brainModelLabel ? (
                          <span className="truncate text-xs text-white/35">
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
                            className="h-8 gap-1.5 px-2 text-xs text-white/45 hover:bg-white/4 hover:text-white/75"
                          >
                            <Trash2 className="size-3.5" />
                            {t("clearHistory")}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="border-white/8 bg-[#111111] text-white">
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t("clearHistoryTitle")}</AlertDialogTitle>
                            <AlertDialogDescription className="text-white/60">
                              {t("clearHistoryDescription")}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="border-white/12 bg-transparent text-white/70 hover:bg-white/4 hover:text-white">
                              {t("clearHistoryCancel")}
                            </AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-white text-black hover:bg-white/90"
                              onClick={() => {
                                void handleClearHistory();
                              }}
                            >
                              {isClearingHistory
                                ? t("clearHistoryClearing")
                                : t("clearHistoryConfirm")}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ) : null}

                <NullxesMessageList />

                <MessageComposer
                  asyncMessagesMultiSendEnabled
                  audioRecordingEnabled
                  hideSendButton
                  maxRows={6}
                  minRows={1}
                />
              </NullxesConversationLayout>
            </Window>
          </Channel>
        </Chat>
      </NullxesStreamWorkspace>
    </TalkChatErrorBoundary>
  );
}
