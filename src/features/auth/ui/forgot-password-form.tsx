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

export function ForgotPasswordForm() {
  const t = useTranslations("auth.forgotPassword");
  const tFields = useTranslations("auth.fields");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setInfo(null);
    setIsSubmitting(true);

    try {
      const redirectTo = `${window.location.origin}/login/reset-password`;
      const { error: resetError } = await authClient.requestPasswordReset({
        email: email.trim(),
        redirectTo,
      });

      if (resetError) {
        setError(resetError.message ?? t("failed"));
        return;
      }

      setInfo(t("sent"));
    } catch (submitError: unknown) {
      const message =
        submitError instanceof Error ? submitError.message : t("failed");
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
          {t("description")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="forgot-email">{tFields("email")}</Label>
            <Input
              id="forgot-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
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
            disabled={isSubmitting}
            className="bg-white text-black hover:bg-white/90"
          >
            {isSubmitting ? t("submitting") : t("submit")}
          </Button>
        </form>
        <p className="mt-6 text-sm text-white/60">
          {t("remembered")}{" "}
          <Link href="/login" className="text-white hover:underline">
            {t("backToSignIn")}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
