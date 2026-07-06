"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
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
import { authClient } from "../client";
import { AUTH_CARD_CLASS, AUTH_INPUT_CLASS } from "./auth-styles";

export function VerifyEmailPendingForm({ email }: { email: string }) {
  const t = useTranslations("auth.verifyEmail");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleResend() {
    setError(null);
    setInfo(null);
    setIsSubmitting(true);

    try {
      const callbackURL = `${window.location.origin}/login?verified=1`;
      const { error: resendError } = await authClient.sendVerificationEmail({
        email,
        callbackURL,
      });

      if (resendError) {
        setError(resendError.message ?? t("resendFailed"));
        return;
      }

      setInfo(t("resent"));
    } catch (submitError: unknown) {
      const message =
        submitError instanceof Error ? submitError.message : t("resendFailed");
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
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
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="verify-email">{t("emailLabel")}</Label>
          <Input
            id="verify-email"
            type="email"
            readOnly
            value={email}
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
          type="button"
          disabled={isSubmitting}
          onClick={handleResend}
          className="bg-white text-black hover:bg-white/90"
        >
          {isSubmitting ? t("resending") : t("resend")}
        </Button>
        <p className="text-sm text-white/60">
          {t("backToSignIn")}{" "}
          <Link href="/login" className="text-white hover:underline">
            {t("signInLink")}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
