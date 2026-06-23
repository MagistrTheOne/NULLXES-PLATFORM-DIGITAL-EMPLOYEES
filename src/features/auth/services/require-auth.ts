import { cache } from "react";
import { redirect } from "next/navigation";
import { getCurrentSession } from "./get-current-session";

async function loadRequiredSession() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}

export const requireAuth = cache(loadRequiredSession);
