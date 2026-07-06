import { redirect } from "next/navigation";
import { getCurrentSession } from "@/features/auth/services/get-current-session";
import {
  hasVerifiedEmailOtp,
  isEmailOtpRequiredForUser,
} from "@/features/auth/services/email-otp";
import { VerifyEmailOtpForm } from "@/features/auth/ui/verify-email-otp-form";
import { AuthPageShell } from "@/features/auth/ui/auth-page-shell";

export default async function VerifyEmailOtpPage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  if (!isEmailOtpRequiredForUser(session.user.email)) {
    redirect("/dashboard");
  }

  const verified = await hasVerifiedEmailOtp(session.user.id);
  if (verified) {
    redirect("/dashboard");
  }

  return (
    <AuthPageShell>
      <VerifyEmailOtpForm email={session.user.email} />
    </AuthPageShell>
  );
}
