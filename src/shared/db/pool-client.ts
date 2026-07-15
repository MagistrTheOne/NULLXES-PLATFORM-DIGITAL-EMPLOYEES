import { neonConfig, Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import { getDatabaseUrl } from "@/shared/config/env";
import { getDeploymentRegion } from "@/shared/config/deployment-profile";
import { drizzleSchema } from "./drizzle-schema";

/**
 * Transaction pool. Global (Neon) uses @neondatabase/serverless.
 * RU deploys (VK/Yandex Managed Postgres) use the same Pool with a standard
 * postgres:// DATABASE_URL — set DEPLOYMENT_REGION=ru at deploy time.
 */
void getDeploymentRegion();

neonConfig.webSocketConstructor = ws;

/** Cap pooled WS connections per serverless isolate (Neon recommends low max). */
const poolMax = (() => {
  const raw = process.env.NEON_POOL_MAX?.trim();
  if (!raw) {
    return 10;
  }
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 20) : 10;
})();

const pool = new Pool({
  connectionString: getDatabaseUrl(),
  max: poolMax,
});

export const dbWithTransactions = drizzle(pool, { schema: drizzleSchema });
