export function formatProviderLabel(provider: string): string {
  if (provider === "openai") {
    return "OpenAI";
  }
  return provider.charAt(0).toUpperCase() + provider.slice(1);
}
