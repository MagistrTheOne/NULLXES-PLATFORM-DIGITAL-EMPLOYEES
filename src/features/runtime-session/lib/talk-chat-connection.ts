import type { Channel as StreamChannel } from "stream-chat";
import { StreamChat } from "stream-chat";
import type { TalkChatCredentials } from "../services/create-talk-chat-session";

const CHAT_CONNECT_ATTEMPTS = 4;
const CHAT_HTTP_TIMEOUT_MS = 20_000;

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
    normalized.includes("fetch failed") ||
    normalized.includes("websocket") ||
    normalized.includes("ws error") ||
    normalized.includes("disconnected") ||
    normalized.includes("connection") ||
    normalized.includes("temporarily") ||
    normalized.includes("429") ||
    normalized.includes("503") ||
    normalized.includes("502")
  );
}

async function withChatRetries<T>(task: () => Promise<T>): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < CHAT_CONNECT_ATTEMPTS; attempt += 1) {
    try {
      return await task();
    } catch (error: unknown) {
      lastError = error;

      if (!isRetryableChatError(error) || attempt === CHAT_CONNECT_ATTEMPTS - 1) {
        throw error;
      }

      await pause(500 * (attempt + 1));
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
    const wsUnhealthy =
      typeof (client as { wsConnection?: { isHealthy?: boolean } }).wsConnection
        ?.isHealthy === "boolean" &&
      (client as { wsConnection?: { isHealthy?: boolean } }).wsConnection
        ?.isHealthy === false;

    if (!isSameUser || wsUnhealthy) {
      if (client.userID) {
        await withChatRetries(() => client.disconnectUser());
      }

      await withChatRetries(() =>
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

    await withChatRetries(() => channel.watch());

    return { client, channel };
  });
}
