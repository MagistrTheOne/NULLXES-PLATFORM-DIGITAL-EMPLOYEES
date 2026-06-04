import { redirect } from "next/navigation";
import { getCurrentSession } from "./get-current-session";

export async function redirectIfAuthenticated() {
  const session = await getCurrentSession();

  if (session) {
    redirect("/dashboard");
  }
}
