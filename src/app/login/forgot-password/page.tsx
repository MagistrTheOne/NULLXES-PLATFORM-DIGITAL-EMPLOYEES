import { redirect } from "next/navigation";
import { getCurrentSession } from "@/features/auth/services/get-current-session";
import { ForgotPasswordForm } from "@/features/auth/ui/forgot-password-form";
import { AuthPageShell } from "@/features/auth/ui/auth-page-shell";

export default async function ForgotPasswordPage() {
  const session = await getCurrentSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <AuthPageShell>
      <ForgotPasswordForm />
    </AuthPageShell>
  );
}
