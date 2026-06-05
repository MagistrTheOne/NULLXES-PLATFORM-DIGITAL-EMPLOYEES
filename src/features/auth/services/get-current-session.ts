import { headers } from "next/headers";
import { withDatabaseRetry } from "@/shared/db/with-database-retry";
import { auth } from "../server";

export async function getCurrentSession() {
  const requestHeaders = await headers();

  return withDatabaseRetry(() =>
    auth.api.getSession({
      headers: requestHeaders,
    }),
  );
}
