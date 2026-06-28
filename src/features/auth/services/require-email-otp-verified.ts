import { cache } from "react";
import { redirect } from "next/navigation";
import { getCurrentSession } from "./get-current-session";
import { hasVerifiedEmailOtp, isEmailOtpEnabled } from "./email-otp";

async function loadEmailOtpGate() {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/login");
  }

  if (!isEmailOtpEnabled()) {
    return session;
  }

  const verified = await hasVerifiedEmailOtp(session.user.id);
  if (!verified) {
    redirect("/login/verify-email-otp");
  }

  return session;
}

export const requireEmailOtpVerified = cache(loadEmailOtpGate);
