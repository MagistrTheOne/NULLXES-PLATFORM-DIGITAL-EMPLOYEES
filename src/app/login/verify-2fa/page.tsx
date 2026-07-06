import { redirect } from "next/navigation";
import { getCurrentSession } from "@/features/auth/services/get-current-session";
import { Verify2faForm } from "@/features/auth/ui/verify-2fa-form";
import { AuthPageShell } from "@/features/auth/ui/auth-page-shell";

export default async function Verify2faPage() {
  const session = await getCurrentSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <AuthPageShell>
      <Verify2faForm />
    </AuthPageShell>
  );
}
