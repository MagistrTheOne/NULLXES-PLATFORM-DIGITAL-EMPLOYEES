import type { AppLocale } from "@/i18n/config";
import { getResendClient, getResendFromAddress } from "./resend-client";

type EmailCopy = { subject: string; html: string };

function buttonHtml(label: string, href: string): string {
  return `<p><a href="${href}" style="display:inline-block;padding:12px 20px;background:#fff;color:#000;text-decoration:none;border-radius:6px;font-weight:600;">${label}</a></p>`;
}

const COPY = {
  verifyEmail: {
    en: (url: string): EmailCopy => ({
      subject: "Verify your NULLXES email",
      html: `
        <p>Confirm your email address to access your NULLXES workspace.</p>
        ${buttonHtml("Verify email", url)}
        <p>This link expires soon. If you did not create an account, ignore this email.</p>
      `.trim(),
    }),
    ru: (url: string): EmailCopy => ({
      subject: "Подтвердите email NULLXES",
      html: `
        <p>Подтвердите адрес электронной почты для доступа к рабочему пространству NULLXES.</p>
        ${buttonHtml("Подтвердить email", url)}
        <p>Ссылка действует ограниченное время. Если вы не регистрировались, проигнорируйте письмо.</p>
      `.trim(),
    }),
  },
  resetPassword: {
    en: (url: string): EmailCopy => ({
      subject: "Reset your NULLXES password",
      html: `
        <p>We received a request to reset your NULLXES password.</p>
        ${buttonHtml("Reset password", url)}
        <p>This link expires soon. If you did not request a reset, ignore this email.</p>
      `.trim(),
    }),
    ru: (url: string): EmailCopy => ({
      subject: "Сброс пароля NULLXES",
      html: `
        <p>Мы получили запрос на сброс пароля NULLXES.</p>
        ${buttonHtml("Сбросить пароль", url)}
        <p>Ссылка действует ограниченное время. Если вы не запрашивали сброс, проигнорируйте письмо.</p>
      `.trim(),
    }),
  },
  existingUserSignUp: {
    en: (): EmailCopy => ({
      subject: "Sign-up attempt with your NULLXES email",
      html: `
        <p>Someone tried to create an account using your email address.</p>
        <p>If this was you, sign in instead. If not, you can safely ignore this email.</p>
      `.trim(),
    }),
    ru: (): EmailCopy => ({
      subject: "Попытка регистрации с вашим email NULLXES",
      html: `
        <p>Кто-то пытался создать аккаунт с вашим адресом электронной почты.</p>
        <p>Если это были вы, войдите в аккаунт. Если нет — просто проигнорируйте письмо.</p>
      `.trim(),
    }),
  },
  postLoginOtp: {
    en: (otp: string): EmailCopy => ({
      subject: "Your NULLXES sign-in code",
      html: `
        <p>Your verification code is:</p>
        <p style="font-size:24px;font-weight:600;letter-spacing:0.2em;">${otp}</p>
        <p>This code expires in 10 minutes. If you did not request it, ignore this email.</p>
      `.trim(),
    }),
    ru: (otp: string): EmailCopy => ({
      subject: "Код входа NULLXES",
      html: `
        <p>Ваш код подтверждения:</p>
        <p style="font-size:24px;font-weight:600;letter-spacing:0.2em;">${otp}</p>
        <p>Код действует 10 минут. Если вы не запрашивали его, проигнорируйте письмо.</p>
      `.trim(),
    }),
  },
} as const;

type SendResult = { sent: boolean; error?: string };

async function sendAuthEmail(input: {
  email: string;
  copy: EmailCopy;
  logTag: string;
}): Promise<SendResult> {
  const resend = getResendClient();
  if (!resend) {
    console.error(
      `[${input.logTag}] RESEND_API_KEY missing — email not sent to ${input.email}`,
    );
    return { sent: false, error: "RESEND_API_KEY is not configured." };
  }

  try {
    const { error } = await resend.emails.send({
      from: getResendFromAddress(),
      to: [input.email],
      subject: input.copy.subject,
      html: input.copy.html,
    });

    if (error) {
      const message =
        typeof error.message === "string" ? error.message : "Resend rejected the send.";
      console.error(`[${input.logTag}] Resend failed for ${input.email}:`, message);
      return { sent: false, error: message };
    }

    return { sent: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${input.logTag}] Resend failed for ${input.email}:`, message);
    return { sent: false, error: message };
  }
}

export function sendEmailVerificationEmail(input: {
  email: string;
  url: string;
  locale: AppLocale;
}): void {
  const copy = COPY.verifyEmail[input.locale](input.url);
  void sendAuthEmail({
    email: input.email,
    copy,
    logTag: "email-verification",
  });
}

export function sendPasswordResetEmail(input: {
  email: string;
  url: string;
  locale: AppLocale;
}): void {
  const copy = COPY.resetPassword[input.locale](input.url);
  void sendAuthEmail({
    email: input.email,
    copy,
    logTag: "password-reset",
  });
}

export function sendExistingUserSignUpEmail(input: {
  email: string;
  locale: AppLocale;
}): void {
  const copy = COPY.existingUserSignUp[input.locale]();
  void sendAuthEmail({
    email: input.email,
    copy,
    logTag: "existing-user-signup",
  });
}

export async function sendPostLoginOtpEmail(input: {
  email: string;
  otp: string;
  locale: AppLocale;
}): Promise<SendResult> {
  const copy = COPY.postLoginOtp[input.locale](input.otp);
  return sendAuthEmail({
    email: input.email,
    copy,
    logTag: "post-login-otp",
  });
}
