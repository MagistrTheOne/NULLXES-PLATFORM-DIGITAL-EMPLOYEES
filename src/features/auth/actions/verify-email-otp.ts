"use server";

import { requireAuth } from "@/features/auth/services/require-auth";
import { verifyEmailOtp } from "@/features/auth/services/email-otp";

export async function verifyEmailOtpAction(input: {
  code: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const session = await requireAuth();

  return verifyEmailOtp({
    userId: session.user.id,
    code: input.code,
  });
}
