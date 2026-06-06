import { drizzle } from "drizzle-orm/neon-http";
import { getDatabaseUrl } from "@/shared/config/env";
import { getDeploymentRegion } from "@/shared/config/deployment-profile";
import { db as defaultDb } from "./client";
import { drizzleSchema } from "./drizzle-schema";

/**
 * Returns the database client for the active deployment region.
 * On single-region deploys this is equivalent to `db`.
 * RU deployments use DATABASE_URL pointing at VK/Yandex Managed Postgres.
 */
export function getDb() {
  void getDeploymentRegion();
  return defaultDb;
}

export function getDbForRegion(_region: "global" | "ru") {
  return defaultDb;
}

export type AppDatabase = ReturnType<typeof drizzle<typeof drizzleSchema>>;
