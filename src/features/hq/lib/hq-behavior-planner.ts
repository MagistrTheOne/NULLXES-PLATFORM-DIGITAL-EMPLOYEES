import type { HqEmployee } from "../types";
import type {
  HqActivitySignals,
  HqBehaviorPlan,
} from "./hq-behavior-types";

export type HqBehaviorPlannerInput = {
  employee: Pick<
    HqEmployee,
    "status" | "isLive" | "runtimeStatus" | "activity" | "task" | "department"
  >;
  signals: HqActivitySignals;
  /** Resolved badge label for bubbles / focus (i18n done upstream). */
  taskBadgeLabel: string | null;
  /** Standup ring slot when gathering; renderer handles walk-to-slot. */
  hasStandup: boolean;
};

/**
 * Maps decompressed activity signals → simulation plan. Chat floor commands
 * persist as `hq_task` (navigate intent); this layer decides walk_path vs desk.
 */
export function planHqBehavior(input: HqBehaviorPlannerInput): HqBehaviorPlan {
  const { signals, taskBadgeLabel, hasStandup } = input;

  if (signals.trigger === "offline") {
    return {
      intent: "offline",
      anchor: "desk",
      animation: "sit",
      movement: "none",
      speechText: null,
    };
  }

  if (signals.trigger === "floor_errand" && input.employee.task) {
    return {
      intent: "move",
      anchor: "path",
      animation: "walk",
      movement: "walk_path",
      focusTarget: input.employee.task.label,
      speechText: signals.focusText ?? input.employee.task.label,
    };
  }

  if (hasStandup) {
    return {
      intent: "standup",
      anchor: "meeting",
      animation: "stand",
      movement: "none",
      focusTarget: taskBadgeLabel ?? undefined,
      speechText: taskBadgeLabel,
    };
  }

  if (signals.trigger === "live_session") {
    return {
      intent: "talk",
      anchor: "desk",
      animation: "listen",
      movement: "none",
      focusTarget: taskBadgeLabel ?? signals.focusText ?? undefined,
      speechText: taskBadgeLabel ?? signals.focusText,
    };
  }

  if (signals.trigger === "task_in_progress") {
    const focus = signals.focusText ?? taskBadgeLabel;
    return {
      intent: "execute_task",
      anchor: "desk",
      animation: "type",
      movement: "none",
      focusTarget: focus ?? undefined,
      speechText: focus,
    };
  }

  if (signals.trigger === "task_queued") {
    return {
      intent: "queue",
      anchor: "desk",
      animation: "idle",
      movement: "none",
      focusTarget: taskBadgeLabel ?? signals.focusText ?? undefined,
      speechText: taskBadgeLabel ?? signals.focusText,
    };
  }

  return {
    intent: "idle",
    anchor: "desk",
    animation: "sit",
    movement: "none",
    speechText: null,
  };
}

/** Legacy SceneEmployee behavior bucket (renderer compat). */
export function behaviorFromPlan(
  plan: HqBehaviorPlan,
  runtimeStatus: HqEmployee["runtimeStatus"],
): "still" | "desk" | "lofi" | "roam" {
  if (runtimeStatus === "offline" || plan.intent === "offline") {
    return "still";
  }
  if (plan.movement === "walk_path") {
    return "roam";
  }
  if (plan.movement === "wander") {
    return "lofi";
  }
  if (
    plan.anchor === "desk" ||
    plan.anchor === "meeting" ||
    plan.movement === "none"
  ) {
    return "desk";
  }
  return "desk";
}
