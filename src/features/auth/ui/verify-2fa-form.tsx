"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
import { ensureWorkspace } from "../services/ensure-workspace";
import { AUTH_CARD_CLASS, AUTH_INPUT_CLASS } from "./auth-styles";

type VerifyMode = "totp" | "email" | "backup";

export function Verify2faForm() {
  const router = useRouter();
  const [mode, setMode] = useState<VerifyMode>("totp");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [isSendingEmailOtp, setIsSendingEmailOtp] = useState(false);

  useEffect(() => {
    if (mode !== "email" || emailOtpSent || isSendingEmailOtp) {
      return;
    }

    let cancelled = false;

    async function sendEmailOtp(): Promise<void> {
      setIsSendingEmailOtp(true);
      setError(null);

      const result = await authClient.twoFactor.sendOtp();

      if (cancelled) {
        return;
      }

      setIsSendingEmailOtp(false);

      if (result.error) {
        setError(
          result.error.message ??
            "Unable to send verification code. Try again or use your authenticator app.",
        );
        return;
      }

      setEmailOtpSent(true);
      setInfo("A verification code was sent to your email.");
    }

    void sendEmailOtp();

    return () => {
      cancelled = true;
    };
  }, [mode, emailOtpSent, isSendingEmailOtp]);

  async function handleResendEmailOtp(): Promise<void> {
    setError(null);
    setInfo(null);
    setIsSendingEmailOtp(true);

    const result = await authClient.twoFactor.sendOtp();
    setIsSendingEmailOtp(false);

    if (result.error) {
      setError(result.error.message ?? "Unable to resend verification code.");
      return;
    }

    setEmailOtpSent(true);
    setInfo("A new verification code was sent to your email.");
  }

  async function finishSignIn(userId: string | undefined, userName: string | undefined) {
    if (userId) {
      try {
        await ensureWorkspace(userId, userName ?? "");
      } catch (provisionError: unknown) {
        const message =
          provisionError instanceof Error
            ? provisionError.message
            : "Unable to prepare workspace";
        setError(message);
        return false;
      }
    }

    router.push("/dashboard");
    router.refresh();
    return true;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setInfo(null);
    setIsSubmitting(true);

    const trimmed = code.trim();
    const result =
      mode === "totp"
        ? await authClient.twoFactor.verifyTotp({
            code: trimmed,
            trustDevice: true,
          })
        : mode === "email"
          ? await authClient.twoFactor.verifyOtp({
              code: trimmed,
              trustDevice: true,
            })
          : await authClient.twoFactor.verifyBackupCode({
              code: trimmed,
              trustDevice: true,
            });

    if (result.error) {
      setIsSubmitting(false);
      const fallbackMessage =
        mode === "totp"
          ? "Invalid authentication code. Check your authenticator app and try again."
          : mode === "email"
            ? "Invalid email code. Request a new code and try again."
            : "Invalid backup code. Each backup code can only be used once.";
      setError(result.error.message ?? fallbackMessage);
      return;
    }

    const finished = await finishSignIn(
      result.data?.user?.id,
      result.data?.user?.name,
    );
    setIsSubmitting(false);

    if (!finished) {
      return;
    }
  }

  function switchMode(nextMode: VerifyMode): void {
    setMode(nextMode);
    setCode("");
    setError(null);
    setInfo(null);
    if (nextMode !== "email") {
      setEmailOtpSent(false);
    }
  }

  const description =
    mode === "totp"
      ? "Enter the 6-digit code from your authenticator app."
      : mode === "email"
        ? emailOtpSent
          ? "Enter the code we sent to your email."
          : "We are sending a verification code to your email."
        : "Enter one of your single-use backup codes.";

  return (
    <Card className={AUTH_CARD_CLASS}>
      <CardHeader className="text-center">
        <CardTitle className="text-center text-xl font-medium tracking-tight">
          Two-factor verification
        </CardTitle>
        <CardDescription className="text-center text-white/60">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={mode === "totp" ? "default" : "outline"}
              className={
                mode === "totp"
                  ? "flex-1 bg-white text-black hover:bg-white/90"
                  : "flex-1 border-white/10 bg-transparent text-white hover:bg-white/5"
              }
              onClick={() => switchMode("totp")}
            >
              Authenticator
            </Button>
            <Button
              type="button"
              variant={mode === "email" ? "default" : "outline"}
              className={
                mode === "email"
                  ? "flex-1 bg-white text-black hover:bg-white/90"
                  : "flex-1 border-white/10 bg-transparent text-white hover:bg-white/5"
              }
              onClick={() => switchMode("email")}
            >
              Email
            </Button>
            <Button
              type="button"
              variant={mode === "backup" ? "default" : "outline"}
              className={
                mode === "backup"
                  ? "flex-1 bg-white text-black hover:bg-white/90"
                  : "flex-1 border-white/10 bg-transparent text-white hover:bg-white/5"
              }
              onClick={() => switchMode("backup")}
            >
              Backup
            </Button>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="two-factor-code">
              {mode === "totp"
                ? "Authentication code"
                : mode === "email"
                  ? "Email code"
                  : "Backup code"}
            </Label>
            <Input
              id="two-factor-code"
              type="text"
              inputMode={mode === "backup" ? "text" : "numeric"}
              autoComplete="one-time-code"
              required
              maxLength={mode === "backup" ? 32 : 8}
              value={code}
              onChange={(event) => setCode(event.target.value)}
              className={AUTH_INPUT_CLASS}
            />
          </div>
          {mode === "email" ? (
            <Button
              type="button"
              variant="outline"
              disabled={isSendingEmailOtp}
              className="border-white/10 bg-transparent text-white hover:bg-white/5"
              onClick={() => void handleResendEmailOtp()}
            >
              {isSendingEmailOtp ? "Sending..." : "Resend email code"}
            </Button>
          ) : null}
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
            disabled={
              isSubmitting ||
              (mode === "email" && !emailOtpSent) ||
              (mode === "totp" ? code.trim().length < 6 : code.trim().length < 4)
            }
            className="bg-white text-black hover:bg-white/90"
          >
            {isSubmitting ? "Verifying..." : "Verify"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
