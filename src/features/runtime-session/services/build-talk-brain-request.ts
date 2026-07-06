import {
  appendScenarioOverlayToPrompt,
  buildScenarioOverlayPrompt,
} from "@/features/scenarios/lib/build-scenario-overlay-prompt";
import { getScenarioTemplateById } from "@/features/scenarios/lib/scenario-templates";
import { getActiveScenarioSessionForTalk } from "@/features/scenarios/services/scenario-session";
import {
  formatKnowledgeContext,
  searchKnowledge,
} from "@/features/knowledge-retrieval";
import { hasReadyKnowledge } from "@/features/knowledge-retrieval/services/has-ready-knowledge";
import { measureTalkPerf } from "../lib/talk-perf-log";
import type { TalkTurnFlags } from "../types/talk-turn-metrics";
import {
  buildTalkSessionBrainCache,
  talkBrainCacheToRequestConfig,
} from "./build-talk-session-brain-cache";
import type { TalkBrainMessage } from "./generate-talk-brain-response";
import type { TalkBrainRequestConfig } from "./build-talk-brain-request-types";
import {
  loadTalkSessionBrainCache,
  saveTalkSessionBrainCache,
} from "./talk-session-brain-cache";

export type { TalkBrainRequestConfig } from "./build-talk-brain-request-types";

export type TalkBrainBuildResult = {
  config: TalkBrainRequestConfig | null;
  perf: {
    buildMs: number;
    ragMs: number | null;
    cacheHit: boolean;
  };
  flags: Pick<TalkTurnFlags, "cacheHit" | "ragUsed">;
};

export async function buildTalkBrainRequest(input: {
  organizationId: string;
  employeeId: string;
  userId?: string;
  sessionId?: string;
  scenarioSessionId?: string;
  messages: TalkBrainMessage[];
}): Promise<TalkBrainBuildResult> {
  const buildStartedAt = performance.now();
  let ragMs: number | null = null;
  let cacheHit = false;

  const userQuery = input.messages.at(-1)?.content.trim() ?? "";

  let cache =
    input.sessionId !== undefined
      ? await loadTalkSessionBrainCache(input.sessionId)
      : null;

  if (!cache) {
    cache = await buildTalkSessionBrainCache({
      organizationId: input.organizationId,
      employeeId: input.employeeId,
    });

    if (cache && input.sessionId) {
      await saveTalkSessionBrainCache(input.sessionId, cache);
    }
  } else {
    cacheHit = true;
  }

  if (!cache) {
    return {
      config: null,
      perf: {
        buildMs: Math.round(performance.now() - buildStartedAt),
        ragMs: null,
        cacheHit: false,
      },
      flags: { cacheHit: false, ragUsed: false },
    };
  }

  const ragStartedAt = performance.now();
  const retrieved = userQuery
    ? await measureTalkPerf(
        "talk.brain.rag",
        async () => {
          if (!(await hasReadyKnowledge(input.employeeId))) {
            return [];
          }
          return searchKnowledge({
            employeeId: input.employeeId,
            query: userQuery,
            topK: 4,
            useSessionCache: true,
          });
        },
        { employeeId: input.employeeId },
      )
    : [];
  ragMs = userQuery ? Math.round(performance.now() - ragStartedAt) : null;

  const knowledgeBlock = formatKnowledgeContext(retrieved);
  let systemPrompt = knowledgeBlock
    ? `${cache.systemPromptBase}\n\n${knowledgeBlock}`
    : cache.systemPromptBase;

  if (input.scenarioSessionId && input.userId) {
    const scenarioSession = await getActiveScenarioSessionForTalk({
      scenarioSessionId: input.scenarioSessionId,
      organizationId: input.organizationId,
      employeeId: input.employeeId,
      userId: input.userId,
    });
    const template = scenarioSession
      ? getScenarioTemplateById(scenarioSession.templateId)
      : undefined;

    if (template) {
      const overlay = buildScenarioOverlayPrompt({
        template,
        employeeName: cache.employeeName,
        employeeRole: cache.employeeRole,
      });
      systemPrompt = appendScenarioOverlayToPrompt(systemPrompt, overlay);
    }
  }

  const buildMs = Math.round(performance.now() - buildStartedAt);

  return {
    config: talkBrainCacheToRequestConfig(cache, systemPrompt),
    perf: {
      buildMs,
      ragMs,
      cacheHit,
    },
    flags: {
      cacheHit,
      ragUsed: retrieved.length > 0,
    },
  };
}
