"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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

export function VerifyEmailOtpForm({ email }: { email: string }) {
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
          setInfo(`A code was already sent to ${email}. Check your inbox.`);
        }
      } else {
        setError(result.message);
      }
      return;
    }

    if (result.devCode) {
      setInfo(`Development code: ${result.devCode}`);
      return;
    }

    if (!result.emailSent) {
      setError("Email delivery is not configured. Contact your administrator.");
      return;
    }

    setInfo(`We sent a code to ${email}.`);
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
    <Card className="w-full max-w-md border-white/10 bg-[#111111] text-white ring-white/10">
      <CardHeader className="text-center">
        <CardTitle className="text-center text-xl font-medium tracking-tight">
          Verify your email
        </CardTitle>
        <CardDescription className="text-center text-white/60">
          Enter the 6-digit code sent to {email}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email-otp-code">Verification code</Label>
            <Input
              id="email-otp-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              maxLength={6}
              value={code}
              onChange={(event) => setCode(event.target.value)}
              className="border-white/10 bg-black/40 text-white"
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
            {isSubmitting ? "Verifying..." : "Continue"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isSending}
            onClick={() => void sendCode(true)}
            className="border-white/10 bg-transparent text-white hover:bg-white/5"
          >
            {isSending ? "Sending..." : "Resend code"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
