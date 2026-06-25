const DEFAULT_CONTEXT_WINDOW = 4096;
const DEFAULT_MAX_OUTPUT_TOKENS = 1024;
const DEFAULT_RESERVED_PROMPT_TOKENS = 2048;
const MIN_OUTPUT_TOKENS = 256;

function readPositiveIntEnv(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) {
    return fallback;
  }

  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/**
 * RunPod SHUTEN vLLM uses a fixed context window (often 4096). max_tokens must
 * leave room for the system prompt, RAG, and chat history.
 */
export function resolveNullxesBrainMaxTokens(configuredMaxTokens: number): number {
  const contextWindow = readPositiveIntEnv(
    "NULLXES_BRAIN_CONTEXT_WINDOW",
    DEFAULT_CONTEXT_WINDOW,
  );
  const outputCeiling = readPositiveIntEnv(
    "NULLXES_BRAIN_MAX_OUTPUT_TOKENS",
    DEFAULT_MAX_OUTPUT_TOKENS,
  );
  const promptReserve = readPositiveIntEnv(
    "NULLXES_BRAIN_RESERVED_PROMPT_TOKENS",
    DEFAULT_RESERVED_PROMPT_TOKENS,
  );

  const contextBudget = Math.max(
    MIN_OUTPUT_TOKENS,
    contextWindow - promptReserve,
  );
  const requested = Number.isFinite(configuredMaxTokens)
    ? configuredMaxTokens
    : outputCeiling;

  return Math.min(requested, outputCeiling, contextBudget);
}
