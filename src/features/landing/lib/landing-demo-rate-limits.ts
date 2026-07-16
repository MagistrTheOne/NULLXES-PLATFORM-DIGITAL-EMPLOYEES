/** Shared public landing demo rate limits (per IP / platform). */

export const LANDING_DEMO_RATE = {
  /** Talk session starts per IP. */
  talkIp: { limit: 20, windowMs: 60 * 60 * 1000 },
  /** Concurrent cost guard across all visitors. */
  talkPlatform: { limit: 300, windowMs: 60 * 60 * 1000 },
  /** Voice session starts per IP. */
  voiceIp: { limit: 20, windowMs: 60 * 60 * 1000 },
  voicePlatform: { limit: 400, windowMs: 60 * 60 * 1000 },
  /** Brain turns during Talk (several per session). */
  brainIp: { limit: 120, windowMs: 60 * 60 * 1000 },
  brainPlatform: { limit: 2_000, windowMs: 60 * 60 * 1000 },
  /** ElevenLabs TTS chunks during Talk. */
  ttsIp: { limit: 200, windowMs: 60 * 60 * 1000 },
} as const;

/** Bucket names — bump suffix when resetting exhausted counters in Redis. */
export const LANDING_DEMO_RATE_BUCKET = {
  talkIp: "landing-demo-talk-v2",
  talkPlatform: "landing-demo-talk-platform-v2",
  voiceIp: "landing-demo-voice-v2",
  voicePlatform: "landing-demo-voice-platform-v2",
  brainIp: "landing-demo-brain-v2",
  brainPlatform: "landing-demo-brain-platform-v2",
  ttsIp: "landing-demo-tts-v2",
} as const;
