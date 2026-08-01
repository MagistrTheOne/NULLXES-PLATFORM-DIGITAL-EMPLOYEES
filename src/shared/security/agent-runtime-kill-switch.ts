/**
 * Ops incident kill switches (env only — no DB).
 *
 * AGENT_RUNTIME_DISABLED — freezes Talk mint, brain-stream, tools, Anam proxy.
 * LANDING_TALK_DISABLED — landing Anam trial + landing brain only.
 */

function envFlagTrue(name: string): boolean {
  const raw = process.env[name]?.trim().toLowerCase();
  return raw === "1" || raw === "true";
}

export function isAgentRuntimeDisabled(): boolean {
  return envFlagTrue("AGENT_RUNTIME_DISABLED");
}

export function isLandingTalkDisabled(): boolean {
  return envFlagTrue("LANDING_TALK_DISABLED") || isAgentRuntimeDisabled();
}

export function agentRuntimeDisabledMessage(): string {
  return "Agent runtime is temporarily disabled by operations.";
}

export function landingTalkDisabledMessage(): string {
  return "Talk trial is temporarily unavailable.";
}
