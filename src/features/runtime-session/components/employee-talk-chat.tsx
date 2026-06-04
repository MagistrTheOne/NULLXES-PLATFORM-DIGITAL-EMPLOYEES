"use client";

import { Component, type ReactNode, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import type { Channel as StreamChannel } from "stream-chat";
import { StreamChat } from "stream-chat";
import {
  Channel,
  Chat,
  MessageComposer,
  MessageList,
  Window,
} from "stream-chat-react";
import type { TalkChatCredentials } from "../services/create-talk-chat-session";

type TalkChatUiState = "connecting" | "ready" | "unavailable";

function TalkChatFallback({ state }: { state: Exclude<TalkChatUiState, "ready"> }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
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
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: unknown): void {
    console.error("Talk chat UI error", error);
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

  useEffect(() => {
    let active = true;
    const chatClient = StreamChat.getInstance(chatSession.apiKey);

    async function connect(): Promise<void> {
      setUiState("connecting");

      try {
        await chatClient.connectUser(
          { id: chatSession.userId, name: chatSession.userName },
          chatSession.token,
        );

        if (!active) {
          return;
        }

        const talkChannel = chatClient.channel(
          chatSession.channelType,
          chatSession.channelId,
        );
        await talkChannel.watch();

        if (!active) {
          return;
        }

        setClient(chatClient);
        setChannel(talkChannel);
        setUiState("ready");
      } catch (connectError: unknown) {
        console.error("Talk chat connection failed", connectError);
        if (!active) {
          return;
        }

        setClient(null);
        setChannel(null);
        setUiState("unavailable");
      }
    }

    void connect();

    return () => {
      active = false;
      setClient(null);
      setChannel(null);
      setUiState("connecting");
      void chatClient.disconnectUser().catch(() => undefined);
    };
  }, [chatSession]);

  if (uiState !== "ready" || !client || !channel) {
    return <TalkChatFallback state={uiState === "ready" ? "connecting" : uiState} />;
  }

  return (
    <TalkChatErrorBoundary>
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
    </TalkChatErrorBoundary>
  );
}
