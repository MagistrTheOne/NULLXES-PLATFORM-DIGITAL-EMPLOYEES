"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestEmailOtpAction } from "../actions/request-email-otp";
import { verifyEmailOtpAction } from "../actions/verify-email-otp";
import { AUTH_CARD_CLASS, AUTH_INPUT_CLASS } from "./auth-styles";

export function VerifyEmailOtpForm({ email }: { email: string }) {
  const t = useTranslations("auth.verifyEmailOtp");
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const hasAutoSent = useRef(false);

  useEffect(() => {
    if (hasAutoSent.current) {
      return;
    }
    hasAutoSent.current = true;
    void sendCode(false);
  }, []);

  async function sendCode(isManual: boolean): Promise<void> {
    setIsSending(true);
    setError(null);

    const result = await requestEmailOtpAction();
    setIsSending(false);

    if (!result.ok) {
      if (result.retryAfterSeconds !== undefined) {
        // Cooldown: benign on initial auto-send, show when user clicks Resend.
        if (isManual) {
          setError(result.message);
        } else if (!info) {
          setInfo(t("description", { email }));
        }
      } else {
        setError(result.message);
      }
      return;
    }

    if (result.devCode) {
      setInfo(`Dev: ${result.devCode}`);
      return;
    }

    if (!result.emailSent) {
      setError(t("resendFailed"));
      return;
    }

    setInfo(t("description", { email }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await verifyEmailOtpAction({ code: code.trim() });
    setIsSubmitting(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Card className={AUTH_CARD_CLASS}>
      <CardHeader className="text-center">
        <CardTitle className="text-center text-xl font-medium tracking-tight">
          {t("title")}
        </CardTitle>
        <CardDescription className="text-center text-white/60">
          {t("description", { email })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email-otp-code">{t("codeLabel")}</Label>
            <Input
              id="email-otp-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              maxLength={6}
              value={code}
              onChange={(event) => setCode(event.target.value)}
              className={AUTH_INPUT_CLASS}
            />
          </div>
          {info ? (
            <p className="text-sm text-white/60" role="status">
              {info}
            </p>
          ) : null}
          {error ? (
            <p className="text-sm text-white/80" role="alert">
              {error}
            </p>
          ) : null}
          <Button
            type="submit"
            disabled={isSubmitting || code.trim().length !== 6}
            className="bg-white text-black hover:bg-white/90"
          >
            {isSubmitting ? t("submitting") : t("submit")}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isSending}
            onClick={() => void sendCode(true)}
            className="border-white/10 bg-transparent text-white hover:bg-white/5"
          >
            {isSending ? t("resending") : t("resend")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
