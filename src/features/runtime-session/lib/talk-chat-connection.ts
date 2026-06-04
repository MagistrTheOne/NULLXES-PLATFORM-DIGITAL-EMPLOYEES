import type { Channel as StreamChannel } from "stream-chat";
import { StreamChat } from "stream-chat";
import type { TalkChatCredentials } from "../services/create-talk-chat-session";

let talkChatMountCount = 0;
let connectionChain: Promise<void> = Promise.resolve();

function enqueueConnection<T>(task: () => Promise<T>): Promise<T> {
  const run = connectionChain.then(task, task);
  connectionChain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export function retainTalkChatMount(): void {
  talkChatMountCount += 1;
}

export function releaseTalkChatMount(apiKey: string): void {
  talkChatMountCount = Math.max(0, talkChatMountCount - 1);

  if (talkChatMountCount > 0) {
    return;
  }

  // Defer so React Strict Mode remount can retain before disconnect runs.
  setTimeout(() => {
    if (talkChatMountCount > 0) {
      return;
    }

    const client = StreamChat.getInstance(apiKey);
    void client.disconnectUser().catch(() => undefined);
  }, 0);
}

export async function connectTalkChatSession(
  chatSession: TalkChatCredentials,
): Promise<{ client: StreamChat; channel: StreamChannel }> {
  return enqueueConnection(async () => {
    const client = StreamChat.getInstance(chatSession.apiKey);
    const isSameUser = client.userID === chatSession.userId;

    if (!isSameUser) {
      if (client.userID) {
        await client.disconnectUser();
      }

      await client.connectUser(
        { id: chatSession.userId, name: chatSession.userName },
        chatSession.token,
      );
    }

    const channel = client.channel(
      chatSession.channelType,
      chatSession.channelId,
    );

    await channel.watch();

    return { client, channel };
  });
}
