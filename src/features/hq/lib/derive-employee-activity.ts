import type { EmployeeStatus } from "@/entities/digital-employee";
import type { HqTaskSnapshot } from "../queries/get-employee-task-snapshots";
import type { HqActivity, HqRuntimeStatus } from "../types";

type ActivityInput = {
  isLive: boolean;
  status: EmployeeStatus;
  tasks: HqTaskSnapshot;
};

/** Map runtime signals onto the floor legend status. */
export function deriveRuntimeStatus(input: ActivityInput): HqRuntimeStatus {
  if (input.status !== "active") {
    return "offline";
  }
  if (input.isLive) {
    return "busy";
  }
  if (input.tasks.inProgressCount > 0 || input.tasks.pendingCount > 0) {
    return "active";
  }
  return "idle";
}

/**
 * Derive the floating badge purely from real signals: live sessions and the
 * employee's actual task queue. The badge text for an in-progress task is the
 * real task title (e.g. "Interview", "Follow up").
 */
export function deriveEmployeeActivity(input: ActivityInput): HqActivity {
  if (input.status !== "active") {
    return { kind: "idle", badge: null };
  }

  if (input.isLive) {
    return { kind: "in_session", badge: { key: "inSession" } };
  }

  if (input.tasks.inProgressTitle) {
    return {
      kind: "working",
      badge: { text: input.tasks.inProgressTitle },
    };
  }

  if (input.tasks.pendingCount > 0) {
    return {
      kind: "queued",
      badge: { key: "queued", count: input.tasks.pendingCount },
    };
  }

  return { kind: "idle", badge: null };
}
