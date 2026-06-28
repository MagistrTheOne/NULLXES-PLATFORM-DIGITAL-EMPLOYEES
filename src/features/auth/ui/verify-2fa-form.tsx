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

type VerifyMode = "totp" | "backup";

export function Verify2faForm() {
  const router = useRouter();
  const [mode, setMode] = useState<VerifyMode>("totp");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const trimmed = code.trim();
    const result =
      mode === "totp"
        ? await authClient.twoFactor.verifyTotp({
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
          : "Invalid backup code. Each backup code can only be used once.";
      setError(result.error.message ?? fallbackMessage);
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
          {mode === "totp"
            ? "Enter the 6-digit code from your authenticator app."
            : "Enter one of your single-use backup codes."}
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
              onClick={() => {
                setMode("totp");
                setCode("");
                setError(null);
              }}
            >
              Authenticator
            </Button>
            <Button
              type="button"
              variant={mode === "backup" ? "default" : "outline"}
              className={
                mode === "backup"
                  ? "flex-1 bg-white text-black hover:bg-white/90"
                  : "flex-1 border-white/10 bg-transparent text-white hover:bg-white/5"
              }
              onClick={() => {
                setMode("backup");
                setCode("");
                setError(null);
              }}
            >
              Backup code
            </Button>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="two-factor-code">
              {mode === "totp" ? "Authentication code" : "Backup code"}
            </Label>
            <Input
              id="two-factor-code"
              type="text"
              inputMode={mode === "totp" ? "numeric" : "text"}
              autoComplete="one-time-code"
              required
              maxLength={mode === "totp" ? 8 : 32}
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
            disabled={
              isSubmitting ||
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
