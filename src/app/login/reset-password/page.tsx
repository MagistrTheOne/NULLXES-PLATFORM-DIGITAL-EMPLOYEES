import { redirect } from "next/navigation";
import { getCurrentSession } from "@/features/auth/services/get-current-session";
import { ResetPasswordForm } from "@/features/auth/ui/reset-password-form";
import { AuthPageShell } from "@/features/auth/ui/auth-page-shell";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const session = await getCurrentSession();

  if (session) {
    redirect("/dashboard");
  }

  const { token, error } = await searchParams;
  const normalizedToken = token?.trim() ?? null;
  const invalidToken =
    error === "INVALID_TOKEN" || error === "invalid_token";

  return (
    <AuthPageShell>
      <ResetPasswordForm
        token={invalidToken ? null : normalizedToken}
        invalidToken={invalidToken && !normalizedToken}
      />
    </AuthPageShell>
  );
}
