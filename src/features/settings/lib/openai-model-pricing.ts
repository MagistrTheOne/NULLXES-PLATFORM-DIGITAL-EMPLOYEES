/**
 * Standard tier pricing per 1M tokens (USD).
 * Source: https://platform.openai.com/docs/pricing
 */
export type OpenAiModelPricing = {
  inputPer1M: number | null;
  outputPer1M: number | null;
};

export const OPENAI_STANDARD_PRICING: Record<string, OpenAiModelPricing> = {
  "gpt-5.5": { inputPer1M: 5, outputPer1M: 30 },
  "gpt-5.5-pro": { inputPer1M: 30, outputPer1M: 180 },
  "gpt-5.4": { inputPer1M: 2.5, outputPer1M: 15 },
  "gpt-5.4-mini": { inputPer1M: 0.75, outputPer1M: 4.5 },
  "gpt-5.4-nano": { inputPer1M: 0.2, outputPer1M: 1.25 },
  "gpt-5.4-pro": { inputPer1M: 30, outputPer1M: 180 },
  "gpt-5.2": { inputPer1M: 1.75, outputPer1M: 14 },
  "gpt-5.2-pro": { inputPer1M: 21, outputPer1M: 168 },
  "gpt-5.1": { inputPer1M: 1.25, outputPer1M: 10 },
  "gpt-5": { inputPer1M: 1.25, outputPer1M: 10 },
  "gpt-5-mini": { inputPer1M: 0.25, outputPer1M: 2 },
  "gpt-5-nano": { inputPer1M: 0.05, outputPer1M: 0.4 },
  "gpt-5-pro": { inputPer1M: 15, outputPer1M: 120 },
  "gpt-4.1": { inputPer1M: 2, outputPer1M: 8 },
  "gpt-4.1-mini": { inputPer1M: 0.4, outputPer1M: 1.6 },
  "gpt-4.1-nano": { inputPer1M: 0.1, outputPer1M: 0.4 },
  "gpt-4o": { inputPer1M: 2.5, outputPer1M: 10 },
  "gpt-4o-2024-05-13": { inputPer1M: 5, outputPer1M: 15 },
  "gpt-4o-mini": { inputPer1M: 0.15, outputPer1M: 0.6 },
  o1: { inputPer1M: 15, outputPer1M: 60 },
  "o1-pro": { inputPer1M: 150, outputPer1M: 600 },
  "o3-pro": { inputPer1M: 20, outputPer1M: 80 },
  o3: { inputPer1M: 2, outputPer1M: 8 },
  "o4-mini": { inputPer1M: 1.1, outputPer1M: 4.4 },
  "o3-mini": { inputPer1M: 1.1, outputPer1M: 4.4 },
  "o1-mini": { inputPer1M: 1.1, outputPer1M: 4.4 },
  "gpt-4-turbo-2024-04-09": { inputPer1M: 10, outputPer1M: 30 },
  "gpt-4-0125-preview": { inputPer1M: 10, outputPer1M: 30 },
  "gpt-4-1106-preview": { inputPer1M: 10, outputPer1M: 30 },
  "gpt-4-1106-vision-preview": { inputPer1M: 10, outputPer1M: 30 },
  "gpt-4-0613": { inputPer1M: 30, outputPer1M: 60 },
  "gpt-4-0314": { inputPer1M: 30, outputPer1M: 60 },
  "gpt-4-32k": { inputPer1M: 60, outputPer1M: 120 },
  "gpt-3.5-turbo": { inputPer1M: 0.5, outputPer1M: 1.5 },
  "gpt-3.5-turbo-0125": { inputPer1M: 0.5, outputPer1M: 1.5 },
  "gpt-3.5-turbo-1106": { inputPer1M: 1, outputPer1M: 2 },
  "gpt-3.5-turbo-0613": { inputPer1M: 1.5, outputPer1M: 2 },
  "gpt-3.5-0301": { inputPer1M: 1.5, outputPer1M: 2 },
  "gpt-3.5-turbo-instruct": { inputPer1M: 1.5, outputPer1M: 2 },
  "gpt-3.5-turbo-16k-0613": { inputPer1M: 3, outputPer1M: 4 },
};

const PRICING_PRIORITY = [
  "gpt-5.4",
  "gpt-5.4-mini",
  "gpt-5.4-nano",
  "gpt-5.2",
  "gpt-5.1",
  "gpt-5",
  "gpt-5-mini",
  "gpt-5-nano",
  "gpt-4.1",
  "gpt-4.1-mini",
  "gpt-4.1-nano",
  "gpt-4o",
  "gpt-4o-mini",
  "o3",
  "o4-mini",
  "o3-mini",
  "o1",
  "o1-mini",
];

function stripDateSuffix(modelId: string): string {
  return modelId.replace(/-\d{4}-\d{2}-\d{2}$/, "");
}

export function resolveOpenAiModelPricing(modelId: string): OpenAiModelPricing | null {
  const direct = OPENAI_STANDARD_PRICING[modelId];
  if (direct) {
    return direct;
  }

  const withoutDate = stripDateSuffix(modelId);
  if (withoutDate !== modelId) {
    const dated = OPENAI_STANDARD_PRICING[withoutDate];
    if (dated) {
      return dated;
    }
  }

  for (const baseId of PRICING_PRIORITY) {
    if (modelId === baseId || modelId.startsWith(`${baseId}-`)) {
      return OPENAI_STANDARD_PRICING[baseId] ?? null;
    }
  }

  return null;
}

export function formatOpenAiModelPricing(
  pricing: OpenAiModelPricing | null,
): string | null {
  if (!pricing?.inputPer1M && !pricing?.outputPer1M) {
    return null;
  }

  const input =
    pricing.inputPer1M === null ? "—" : `$${formatUsd(pricing.inputPer1M)}`;
  const output =
    pricing.outputPer1M === null ? "—" : `$${formatUsd(pricing.outputPer1M)}`;

  return `${input} / 1M in · ${output} / 1M out`;
}

function formatUsd(value: number): string {
  return value.toFixed(value < 1 ? 2 : 2).replace(/\.?0+$/, "");
}

export function compareOpenAiModelIds(a: string, b: string): number {
  const rank = (id: string) => {
    const exact = PRICING_PRIORITY.indexOf(id);
    if (exact >= 0) {
      return exact;
    }

    const prefix = PRICING_PRIORITY.findIndex((baseId) => id.startsWith(`${baseId}-`));
    if (prefix >= 0) {
      return prefix;
    }

    return PRICING_PRIORITY.length + 1;
  };

  const rankDiff = rank(a) - rank(b);
  if (rankDiff !== 0) {
    return rankDiff;
  }

  return a.localeCompare(b);
}
