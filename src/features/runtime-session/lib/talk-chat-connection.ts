import type { Channel as StreamChannel } from "stream-chat";
import { StreamChat } from "stream-chat";
import type { TalkChatCredentials } from "../services/create-talk-chat-session";

const CHAT_CONNECT_ATTEMPTS = 3;
const CHAT_HTTP_TIMEOUT_MS = 15_000;

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

async function pause(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableChatError(error: unknown): boolean {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" &&
          error !== null &&
          "message" in error &&
          typeof (error as { message?: unknown }).message === "string"
        ? (error as { message: string }).message
        : String(error);

  const normalized = message.toLowerCase();

  return (
    normalized.includes("timeout") ||
    normalized.includes("network") ||
    normalized.includes("econnaborted") ||
    normalized.includes("fetch failed")
  );
}

async function withChatRetries<T>(label: string, task: () => Promise<T>): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < CHAT_CONNECT_ATTEMPTS; attempt += 1) {
    try {
      return await task();
    } catch (error: unknown) {
      lastError = error;

      if (!isRetryableChatError(error) || attempt === CHAT_CONNECT_ATTEMPTS - 1) {
        throw error;
      }

      console.warn(
        `${label} failed (attempt ${attempt + 1}/${CHAT_CONNECT_ATTEMPTS}), retrying…`,
        error,
      );
      await pause(400 * (attempt + 1));
    }
  }

  throw lastError;
}

function configureChatClient(client: StreamChat): void {
  client.axiosInstance.defaults.timeout = CHAT_HTTP_TIMEOUT_MS;
}

export function retainTalkChatMount(): void {
  talkChatMountCount += 1;
}

export function releaseTalkChatMount(apiKey: string): void {
  talkChatMountCount = Math.max(0, talkChatMountCount - 1);

  if (talkChatMountCount > 0) {
    return;
  }

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
    configureChatClient(client);

    const isSameUser = client.userID === chatSession.userId;

    if (!isSameUser) {
      if (client.userID) {
        await withChatRetries("Talk chat disconnect", () => client.disconnectUser());
      }

      await withChatRetries("Talk chat connectUser", () =>
        client.connectUser(
          { id: chatSession.userId, name: chatSession.userName },
          chatSession.token,
        ),
      );
    }

    const channel = client.channel(
      chatSession.channelType,
      chatSession.channelId,
    );

    await withChatRetries("Talk chat channel watch", () => channel.watch());

    return { client, channel };
  });
}
