type RegenerateHandler = (botMessageId: string) => Promise<void>;

let regenerateHandler: RegenerateHandler | null = null;

export function registerTalkRegenerateHandler(
  handler: RegenerateHandler | null,
): void {
  regenerateHandler = handler;
}

export async function regenerateTalkMessage(
  botMessageId: string,
): Promise<void> {
  if (!regenerateHandler) {
    return;
  }

  await regenerateHandler(botMessageId);
}
