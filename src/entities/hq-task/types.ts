import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { hqTask, hqTaskDestinationEnum, hqTaskStatusEnum } from "./schema";

export type HqTaskRow = InferSelectModel<typeof hqTask>;
export type NewHqTaskRow = InferInsertModel<typeof hqTask>;
export type HqTaskStatus = (typeof hqTaskStatusEnum.enumValues)[number];
export type HqTaskDestination =
  (typeof hqTaskDestinationEnum.enumValues)[number];
