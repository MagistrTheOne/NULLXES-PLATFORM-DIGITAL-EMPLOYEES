import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  employeeTask,
  employeeTaskSourceEnum,
  employeeTaskStatusEnum,
} from "./schema";

export type EmployeeTask = InferSelectModel<typeof employeeTask>;
export type NewEmployeeTask = InferInsertModel<typeof employeeTask>;
export type EmployeeTaskStatus =
  (typeof employeeTaskStatusEnum.enumValues)[number];
export type EmployeeTaskSource =
  (typeof employeeTaskSourceEnum.enumValues)[number];
