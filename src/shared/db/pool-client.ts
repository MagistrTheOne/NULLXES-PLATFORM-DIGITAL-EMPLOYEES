import { neonConfig, Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import { getDatabaseUrl } from "@/shared/config/env";
import { drizzleSchema } from "./drizzle-schema";

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: getDatabaseUrl() });

export const dbWithTransactions = drizzle(pool, { schema: drizzleSchema });
