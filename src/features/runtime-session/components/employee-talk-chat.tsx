"use client";

import { Component, type ReactNode, useEffect, useRef, useState } from "react";
import { Loader2, MessageSquare, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import {
  connectTalkChatSession,
  releaseTalkChatMount,
  retainTalkChatMount,
} from "../lib/talk-chat-connection";
type TalkChatUiState = "connecting" | "ready" | "unavailable";

function TalkChatEmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
      <MessageSquare className="size-10 stroke-[1.25] text-white/25" />
      <p className="max-w-[220px] text-sm leading-relaxed text-white/45">
        Отправьте сообщение, чтобы начать разговор
      </p>
    </div>
  );
}

function TalkChatFallback({
  state,
  onRetry,
}: {
  state: Exclude<TalkChatUiState, "ready">;
  onRetry?: () => void;
}) {
  return (
    <div className="employee-talk-chat-fallback flex h-full flex-col items-center justify-center gap-3 px-4 text-center">
      {state === "connecting" ? (
        <>
          <Loader2 className="size-4 animate-spin text-white/50" />
          <p className="text-sm text-white/50">Connecting…</p>
        </>
      ) : (
        <>
          <p className="text-sm text-white/50">Conversation unavailable</p>
          {onRetry ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-white/12 text-white/70"
              onClick={onRetry}
            >
              <RotateCcw className="size-3.5" />
              Retry
            </Button>
          ) : null}
        </>
      )}
    </div>
  );
}

class TalkChatErrorBoundary extends Component<
  { onError: () => void; children: ReactNode },
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
      return <TalkChatFallback state="unavailable" />;
    }

    return this.props.children;
  }
}

export function EmployeeTalkChat({
  chatSession,
}: {
  chatSession: TalkChatCredentials;
}) {
  const [client, setClient] = useState<StreamChat | null>(null);
  const [channel, setChannel] = useState<StreamChannel | null>(null);
  const [uiState, setUiState] = useState<TalkChatUiState>("connecting");
  const [connectAttempt, setConnectAttempt] = useState(0);
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
      textarea.setAttribute("placeholder", "Отправьте сообщение...");
    }
  }, [uiState]);

  if (uiState !== "ready" || !client || !channel) {
    return (
      <TalkChatFallback
        state={uiState === "ready" ? "connecting" : uiState}
        onRetry={
          uiState === "unavailable"
            ? () => setConnectAttempt((current) => current + 1)
            : undefined
        }
      />
    );
  }

  return (
    <TalkChatErrorBoundary onError={() => setUiState("unavailable")}>
      <div className="employee-talk-chat-surface relative h-full min-h-0">
        <Chat client={client} theme="str-chat__theme-dark">
          <Channel channel={channel}>
            <Window>
              <div className="employee-talk-chat-header border-b border-white/10 px-4 py-3 text-[11px] font-medium tracking-[0.12em] text-white/50 uppercase">
                Session chat
              </div>
              <div className="employee-talk-chat-messages relative min-h-0 flex-1">
                <TalkChatEmptyOverlay channel={channel} />
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

function TalkChatEmptyOverlay({ channel }: { channel: StreamChannel }) {
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
      <TalkChatEmptyState />
    </div>
  );
}
