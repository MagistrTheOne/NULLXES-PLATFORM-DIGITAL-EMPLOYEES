import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { employeeHandoff, employeeHandoffStatusEnum } from "./schema";

export type EmployeeHandoff = InferSelectModel<typeof employeeHandoff>;
export type NewEmployeeHandoff = InferInsertModel<typeof employeeHandoff>;
export type EmployeeHandoffStatus =
  (typeof employeeHandoffStatusEnum.enumValues)[number];
