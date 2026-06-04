import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  employeeLifecycleEvent,
  employeeLifecycleEventTypeEnum,
} from "./schema";

export type EmployeeLifecycleEvent = InferSelectModel<
  typeof employeeLifecycleEvent
>;
export type NewEmployeeLifecycleEvent = InferInsertModel<
  typeof employeeLifecycleEvent
>;

export type EmployeeLifecycleEventType =
  (typeof employeeLifecycleEventTypeEnum.enumValues)[number];
