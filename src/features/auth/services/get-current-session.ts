import { cache } from "react";
import { headers } from "next/headers";
import { withDatabaseRetry } from "@/shared/db/with-database-retry";
import { auth } from "../server";

async function loadCurrentSession() {
  const requestHeaders = await headers();

  return withDatabaseRetry(() =>
    auth.api.getSession({
      headers: requestHeaders,
    }),
  );
}

export const getCurrentSession = cache(loadCurrentSession);

