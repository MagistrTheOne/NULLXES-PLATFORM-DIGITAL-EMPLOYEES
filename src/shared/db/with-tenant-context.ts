import { sql } from "drizzle-orm";
import { dbWithTransactions } from "./pool-client";

type Tx = Parameters<
  Parameters<typeof dbWithTransactions.transaction>[0]
>[0];

/**
 * Run work inside a transaction with tenant RLS claim set.
 * Sets `app.organization_id` and `app.bypass_rls = off`.
 */
export async function withTenantContext<T>(
  organizationId: string,
  fn: (tx: Tx) => Promise<T>,
): Promise<T> {
  return dbWithTransactions.transaction(async (tx) => {
    await tx.execute(
      sql`select set_config('app.organization_id', ${organizationId}, true)`,
    );
    await tx.execute(sql`select set_config('app.bypass_rls', 'off', true)`);
    return fn(tx);
  });
}

/**
 * Run work with RLS bypass (Inngest workers, platform ops, migrations helpers).
 */
export async function withRlsBypass<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
  return dbWithTransactions.transaction(async (tx) => {
    await tx.execute(sql`select set_config('app.bypass_rls', 'on', true)`);
    return fn(tx);
  });
}
