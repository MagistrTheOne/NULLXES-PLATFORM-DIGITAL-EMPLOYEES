import { redirect } from "next/navigation";
import { getCurrentSession } from "@/features/auth/services/get-current-session";

export default async function HomePage() {
  const session = await getCurrentSession();
  redirect(session ? "/dashboard" : "/login");
}
