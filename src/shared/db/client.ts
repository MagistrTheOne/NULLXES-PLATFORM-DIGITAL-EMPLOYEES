import "server-only";

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import { getDatabaseUrl } from "@/shared/config/env";
import { drizzleSchema } from "./drizzle-schema";

type Db = NeonHttpDatabase<typeof drizzleSchema>;

let dbInstance: Db | null = null;

function createDb(): Db {
  const sql = neon(getDatabaseUrl());
  return drizzle({
    client: sql,
    schema: drizzleSchema,
  });
}

function getDb(): Db {
  if (!dbInstance) {
    dbInstance = createDb();
  }
  return dbInstance;
}

export const db = new Proxy({} as Db, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb() as object, prop, receiver);
  },
});
