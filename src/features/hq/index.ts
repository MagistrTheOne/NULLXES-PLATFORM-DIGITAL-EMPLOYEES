export { HqScreen } from "./components/hq-screen";
export { getHqState } from "./services/get-hq-state";
export type {
  HqDepartment,
  HqDepartmentGroup,
  HqEmployee,
  HqState,
} from "./types";
export { planHqBehavior, behaviorFromPlan } from "./lib/hq-behavior-planner";
export type {
  HqBehaviorPlan,
  HqBehaviorIntent,
} from "./lib/hq-behavior-types";
export {
  deriveActivitySignals,
  deriveEmployeeActivity,
  deriveRuntimeStatus,
} from "./lib/derive-employee-activity";
export { parseHqIntent } from "./lib/parse-hq-command";
