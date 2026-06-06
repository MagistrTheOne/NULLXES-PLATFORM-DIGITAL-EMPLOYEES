"use client";

import { useRouter } from "next/navigation";
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
import { ensureWorkspace } from "../services/ensure-workspace";

export function Verify2faForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await authClient.twoFactor.verifyTotp({
      code: code.trim(),
      trustDevice: true,
    });

    if (result.error) {
      setIsSubmitting(false);
      setError(result.error.message ?? "Invalid verification code");
      return;
    }

    const userId = result.data?.user?.id;
    if (userId) {
      try {
        await ensureWorkspace(userId, result.data.user?.name ?? "");
      } catch (provisionError: unknown) {
        setIsSubmitting(false);
        const message =
          provisionError instanceof Error
            ? provisionError.message
            : "Unable to prepare workspace";
        setError(message);
        return;
      }
    }

    setIsSubmitting(false);
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Card className="w-full max-w-md border-white/10 bg-[#111111] text-white ring-white/10">
      <CardHeader className="text-center">
        <CardTitle className="text-center text-xl font-medium tracking-tight">
          Two-factor verification
        </CardTitle>
        <CardDescription className="text-center text-white/60">
          Enter the 6-digit code from your authenticator app.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="totp-code">Authentication code</Label>
            <Input
              id="totp-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              maxLength={8}
              value={code}
              onChange={(event) => setCode(event.target.value)}
              className="border-white/10 bg-black/40 text-white"
            />
          </div>
          {error ? (
            <p className="text-sm text-white/80" role="alert">
              {error}
            </p>
          ) : null}
          <Button
            type="submit"
            disabled={isSubmitting || code.trim().length < 6}
            className="bg-white text-black hover:bg-white/90"
          >
            {isSubmitting ? "Verifying..." : "Verify"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
