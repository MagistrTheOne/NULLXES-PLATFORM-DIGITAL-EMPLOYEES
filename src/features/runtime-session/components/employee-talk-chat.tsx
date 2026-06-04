"use client";

import { Component, type ReactNode, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
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

function TalkChatFallback({ state }: { state: Exclude<TalkChatUiState, "ready"> }) {
  return (
    <div className="employee-talk-chat-fallback flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
      {state === "connecting" ? (
        <>
          <Loader2 className="size-4 animate-spin text-white/50" />
          <p className="text-sm text-white/50">Connecting…</p>
        </>
      ) : (
        <p className="text-sm text-white/50">Conversation unavailable</p>
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
  ]);

  if (uiState !== "ready" || !client || !channel) {
    return <TalkChatFallback state={uiState === "ready" ? "connecting" : uiState} />;
  }

  return (
    <TalkChatErrorBoundary onError={() => setUiState("unavailable")}>
      <div className="employee-talk-chat-surface h-full min-h-0">
        <Chat client={client} theme="str-chat__theme-dark">
          <Channel channel={channel}>
            <Window>
              <div className="employee-talk-chat-header border-b border-white/10 px-3 py-2 text-xs tracking-wide text-white/50 uppercase">
                Session chat
              </div>
              <MessageList />
              <MessageComposer />
            </Window>
          </Channel>
        </Chat>
      </div>
    </TalkChatErrorBoundary>
  );
}
