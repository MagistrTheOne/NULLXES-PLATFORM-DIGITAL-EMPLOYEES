"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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

export function ResetPasswordForm({
  token,
  invalidToken,
}: {
  token: string | null;
  invalidToken?: boolean;
}) {
  const t = useTranslations("auth.resetPassword");
  const tFields = useTranslations("auth.fields");
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!token) {
      setError(t("invalidToken"));
      return;
    }

    if (password.length < 8) {
      setError(t("tooShort"));
      return;
    }

    if (password !== confirmPassword) {
      setError(t("mismatch"));
      return;
    }

    setIsSubmitting(true);

    try {
      const { error: resetError } = await authClient.resetPassword({
        newPassword: password,
        token,
      });

      if (resetError) {
        setError(resetError.message ?? t("failed"));
        return;
      }

      router.push("/login?reset=1");
      router.refresh();
    } catch (submitError: unknown) {
      const message =
        submitError instanceof Error ? submitError.message : t("failed");
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!token || invalidToken) {
    return (
      <Card className={AUTH_CARD_CLASS}>
        <CardHeader className="text-center">
          <CardTitle className="text-center text-xl font-medium tracking-tight">
            {t("invalidTitle")}
          </CardTitle>
          <CardDescription className="text-center text-white/60">
            {t("invalidDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href="/login/forgot-password"
            className="inline-flex h-10 w-full items-center justify-center rounded-md bg-white text-sm font-medium text-black hover:bg-white/90"
          >
            {t("requestNew")}
          </Link>
        </CardContent>
      </Card>
    );
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
            <Label htmlFor="new-password">{tFields("newPassword")}</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={AUTH_INPUT_CLASS}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="confirm-password">{tFields("confirmPassword")}</Label>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className={AUTH_INPUT_CLASS}
            />
          </div>
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
          <Link href="/login" className="text-white hover:underline">
            {t("backToSignIn")}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
