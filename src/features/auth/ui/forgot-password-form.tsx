"use client";

import Link from "next/link";
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

export function ForgotPasswordForm() {
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
        setError(resetError.message ?? "Unable to send reset email.");
        return;
      }

      setInfo(
        "If an account exists for this email, we sent a password reset link.",
      );
    } catch (submitError: unknown) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Unable to send reset email.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-md border-white/10 bg-[#111111] text-white ring-white/10">
      <CardHeader className="text-center">
        <CardTitle className="text-center text-xl font-medium tracking-tight">
          Reset password
        </CardTitle>
        <CardDescription className="text-center text-white/60">
          Enter your email and we will send a reset link.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="forgot-email">Email</Label>
            <Input
              id="forgot-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
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
            disabled={isSubmitting}
            className="bg-white text-black hover:bg-white/90"
          >
            {isSubmitting ? "Sending..." : "Send reset link"}
          </Button>
        </form>
        <p className="mt-6 text-sm text-white/60">
          Remembered your password?{" "}
          <Link href="/login" className="text-white hover:underline">
            Back to sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
