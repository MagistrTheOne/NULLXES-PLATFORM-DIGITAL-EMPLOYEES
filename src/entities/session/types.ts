import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { employeeSession, employeeSessionStatusEnum } from "./schema";

export type EmployeeSession = InferSelectModel<typeof employeeSession>;
export type NewEmployeeSession = InferInsertModel<typeof employeeSession>;

export type EmployeeSessionStatus =
  (typeof employeeSessionStatusEnum.enumValues)[number];
