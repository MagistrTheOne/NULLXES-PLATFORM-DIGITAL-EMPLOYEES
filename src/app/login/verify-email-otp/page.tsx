import { redirect } from "next/navigation";
import { getCurrentSession } from "@/features/auth/services/get-current-session";
import { hasVerifiedEmailOtp } from "@/features/auth/services/email-otp";
import { VerifyEmailOtpForm } from "@/features/auth/ui/verify-email-otp-form";

export default async function VerifyEmailOtpPage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  const verified = await hasVerifiedEmailOtp(session.user.id);
  if (verified) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-full flex-1 items-center justify-center bg-black px-6 py-16">
      <div className="w-full max-w-md">
        <p className="mb-8 text-center text-xs tracking-[0.3em] text-white/50 uppercase">
          NULLXES Digital Employees
        </p>
        <VerifyEmailOtpForm email={session.user.email} />
      </div>
    </main>
  );
}
