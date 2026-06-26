/** High-level operational intent derived from backend signals. */
export type HqBehaviorIntent =
  | "execute_task"
  | "talk"
  | "queue"
  | "move"
  | "idle"
  | "standup"
  | "offline";

/** Where the agent anchors in the scene. */
export type HqBehaviorAnchor = "desk" | "room" | "path" | "meeting";

/** Pose / micro-animation the renderer applies at the anchor. */
export type HqBehaviorAnimation =
  | "sit"
  | "type"
  | "walk"
  | "listen"
  | "idle"
  | "stand";

/** Locomotion mode — independent from intent (chat stores intent, planner picks movement). */
export type HqBehaviorMovement = "none" | "walk_path" | "wander";

/**
 * Semantic plan consumed by the 3D renderer. Sits between raw HQ state and
 * SceneEmployee motion.
 */
export type HqBehaviorPlan = {
  intent: HqBehaviorIntent;
  anchor: HqBehaviorAnchor;
  animation: HqBehaviorAnimation;
  movement: HqBehaviorMovement;
  /** What the agent is focused on (task title, session, destination). */
  focusTarget?: string;
  /** Preferred speech-bubble text (real signal over lofi pool). */
  speechText?: string | null;
};

/** Decompressed trigger before intent mapping (truth layer → planner). */
export type HqActivityTrigger =
  | "offline"
  | "floor_errand"
  | "live_session"
  | "task_in_progress"
  | "task_queued"
  | "idle";

export type HqActivitySignals = {
  trigger: HqActivityTrigger;
  focusText: string | null;
};
