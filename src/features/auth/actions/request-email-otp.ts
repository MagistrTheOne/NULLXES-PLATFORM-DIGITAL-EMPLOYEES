"use server";

import { requireAuth } from "@/features/auth/services/require-auth";
import { requestEmailOtp } from "@/features/auth/services/email-otp";

export async function requestEmailOtpAction(): Promise<
  | { ok: true; emailSent: boolean; devCode?: string }
  | { ok: false; message: string; retryAfterSeconds?: number }
> {
  const session = await requireAuth();

  return requestEmailOtp({
    userId: session.user.id,
    email: session.user.email,
  });
}
