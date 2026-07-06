import { redirect } from "next/navigation";
import { getCurrentSession } from "@/features/auth/services/get-current-session";
import { VerifyEmailPendingForm } from "@/features/auth/ui/verify-email-pending-form";
import { AuthPageShell } from "@/features/auth/ui/auth-page-shell";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const session = await getCurrentSession();

  if (session) {
    redirect("/dashboard");
  }

  const { email } = await searchParams;
  const normalizedEmail = email?.trim();

  if (!normalizedEmail) {
    redirect("/login");
  }

  return (
    <AuthPageShell>
      <VerifyEmailPendingForm email={normalizedEmail} />
    </AuthPageShell>
  );
}
