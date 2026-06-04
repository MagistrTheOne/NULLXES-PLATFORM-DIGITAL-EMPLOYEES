export function formatProviderLabel(provider: string): string {
  if (provider === "openai") {
    return "OpenAI";
  }

  if (provider === "elevenlabs" || provider === "elevenlabs_shell") {
    return "ElevenLabs";
  }

  if (provider === "anam") {
    return "Anam";
  }

  return provider.charAt(0).toUpperCase() + provider.slice(1);
}
