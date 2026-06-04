import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  avatarProviderEnum,
  brainProviderEnum,
  digitalEmployee,
  employeeStatusEnum,
} from "./schema";

export type DigitalEmployee = InferSelectModel<typeof digitalEmployee>;
export type NewDigitalEmployee = InferInsertModel<typeof digitalEmployee>;

export type EmployeeStatus = (typeof employeeStatusEnum.enumValues)[number];
export type AvatarProvider = (typeof avatarProviderEnum.enumValues)[number];
export type BrainProvider = (typeof brainProviderEnum.enumValues)[number];
