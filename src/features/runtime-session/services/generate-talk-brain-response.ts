import {
  collectTalkBrainResponse,
  streamTalkBrainResponse,
} from "./stream-talk-brain-response";

export type TalkBrainMessage = {
  role: "user" | "assistant";
  content: string;
};

export async function generateTalkBrainResponse(input: {
  model: string;
  systemPrompt: string;
  messages: TalkBrainMessage[];
  temperature?: number;
  maxTokens?: number;
}): Promise<string> {
  return collectTalkBrainResponse(input);
}

export { streamTalkBrainResponse };
