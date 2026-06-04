import { dbWithTransactions } from "./pool-client";

export type DbExecutor = Pick<
  typeof dbWithTransactions,
  "insert" | "select" | "update" | "delete"
>;
