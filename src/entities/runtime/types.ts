import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { employeeRuntime } from "./schema";

export type EmployeeRuntime = InferSelectModel<typeof employeeRuntime>;
export type NewEmployeeRuntime = InferInsertModel<typeof employeeRuntime>;
