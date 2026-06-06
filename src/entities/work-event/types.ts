import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { employeeWorkEvent, employeeWorkEventTypeEnum } from "./schema";

export type EmployeeWorkEvent = InferSelectModel<typeof employeeWorkEvent>;
export type NewEmployeeWorkEvent = InferInsertModel<typeof employeeWorkEvent>;
export type EmployeeWorkEventType =
  (typeof employeeWorkEventTypeEnum.enumValues)[number];
