import { redirect } from "next/navigation";
import { getCurrentSession } from "./get-current-session";

export async function requireAuth() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}
