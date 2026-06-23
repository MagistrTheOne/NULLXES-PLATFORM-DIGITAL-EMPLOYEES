import OpenAI from "openai";
import { getOpenAiApiKey } from "@/shared/config/provider-env";

const MAX_PROMPT_LENGTH = 500;

export function buildAvatarImagePrompt(
  userPrompt: string,
  context?: { name?: string; role?: string },
): string {
  const trimmed = userPrompt.trim().slice(0, MAX_PROMPT_LENGTH);
  if (!trimmed) {
    throw new Error("Avatar prompt is required");
  }

  const subject =
    context?.name?.trim() || context?.role?.trim()
      ? `Subject: ${context.name?.trim() || "digital employee"}, ${context.role?.trim() || "professional"}.`
      : "";

  return [
    "Professional studio headshot portrait for a digital employee.",
    trimmed,
    subject,
    "Photorealistic, neutral background, shoulders up, enterprise suitable, no text, no logos, no watermark.",
  ]
    .filter(Boolean)
    .join(" ");
}

export async function generatePortraitImageFromPrompt(input: {
  prompt: string;
  name?: string;
  role?: string;
}): Promise<{ base64: string; mimeType: string; fileName: string }> {
  const apiKey = getOpenAiApiKey();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const client = new OpenAI({ apiKey });
  const prompt = buildAvatarImagePrompt(input.prompt, {
    name: input.name,
    role: input.role,
  });

  let image: OpenAI.Images.Image | undefined;

  try {
    const response = await client.images.generate({
      model: "gpt-image-1",
      prompt,
      size: "1024x1024",
      n: 1,
    });
    image = response.data?.[0];
  } catch {
    const response = await client.images.generate({
      model: "dall-e-3",
      prompt,
      size: "1024x1024",
      response_format: "b64_json",
      n: 1,
    });
    image = response.data?.[0];
  }

  if (image?.b64_json) {
    return {
      base64: image.b64_json,
      mimeType: "image/png",
      fileName: "generated-avatar.png",
    };
  }

  if (image?.url) {
    const imageResponse = await fetch(image.url);
    if (!imageResponse.ok) {
      throw new Error("Failed to download generated image");
    }

    const buffer = Buffer.from(await imageResponse.arrayBuffer());
    return {
      base64: buffer.toString("base64"),
      mimeType: imageResponse.headers.get("content-type") ?? "image/png",
      fileName: "generated-avatar.png",
    };
  }

  throw new Error("Image generation returned an empty response");
}
