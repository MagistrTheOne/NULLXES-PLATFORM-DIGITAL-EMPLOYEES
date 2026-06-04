"use client";

import { useEffect, useState } from "react";
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

export function EmployeeTalkChat({
  chatSession,
}: {
  chatSession: TalkChatCredentials;
}) {
  const [client, setClient] = useState<StreamChat | null>(null);
  const [channel, setChannel] = useState<StreamChannel | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const chatClient = StreamChat.getInstance(chatSession.apiKey);

    async function connect(): Promise<void> {
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
      } catch (connectError: unknown) {
        if (!active) {
          return;
        }

        setError(
          connectError instanceof Error
            ? connectError.message
            : "Failed to connect chat",
        );
      }
    }

    void connect();

    return () => {
      active = false;
      void chatClient.disconnectUser().catch(() => undefined);
      setClient(null);
      setChannel(null);
    };
  }, [chatSession]);

  if (error) {
    return (
      <div className="flex h-full items-center justify-center px-4 text-sm text-white/55">
        {error}
      </div>
    );
  }

  if (!client || !channel) {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-sm text-white/50">
        <Loader2 className="size-4 animate-spin" />
        Loading chat…
      </div>
    );
  }

  return (
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
  );
}
