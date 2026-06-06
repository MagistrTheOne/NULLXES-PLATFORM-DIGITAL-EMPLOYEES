const APPROX_CHARS_PER_TOKEN = 4;
const DEFAULT_MAX_CHUNK_CHARS = 3200;

export function estimateTokenCount(text: string): number {
  return Math.max(1, Math.ceil(text.length / APPROX_CHARS_PER_TOKEN));
}

export function splitTextIntoChunks(
  text: string,
  maxChunkChars = DEFAULT_MAX_CHUNK_CHARS,
): string[] {
  const normalized = text.trim();
  if (!normalized) {
    return [];
  }

  if (normalized.length <= maxChunkChars) {
    return [normalized];
  }

  const paragraphs = normalized.split(/\n{2,}/);
  const chunks: string[] = [];
  let current = "";

  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim();
    if (!trimmed) {
      continue;
    }

    const candidate = current ? `${current}\n\n${trimmed}` : trimmed;
    if (candidate.length <= maxChunkChars) {
      current = candidate;
      continue;
    }

    if (current) {
      chunks.push(current);
      current = "";
    }

    if (trimmed.length <= maxChunkChars) {
      current = trimmed;
      continue;
    }

    for (let offset = 0; offset < trimmed.length; offset += maxChunkChars) {
      chunks.push(trimmed.slice(offset, offset + maxChunkChars).trim());
    }
  }

  if (current) {
    chunks.push(current);
  }

  return chunks.filter(Boolean);
}
