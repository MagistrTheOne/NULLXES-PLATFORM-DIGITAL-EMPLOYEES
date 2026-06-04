"use client";

import Link from "next/link";
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

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const { data, error: signInError } = await authClient.signIn.email({
      email,
      password,
      rememberMe: true,
    });

    if (signInError) {
      setIsSubmitting(false);
      setError(signInError.message ?? "Unable to sign in");
      return;
    }

    const userId = data?.user?.id;
    if (!userId) {
      setIsSubmitting(false);
      setError("Signed in without a user identifier");
      return;
    }

    try {
      await ensureWorkspace(userId, data.user?.name ?? email);
    } catch (provisionError: unknown) {
      setIsSubmitting(false);
      const message =
        provisionError instanceof Error
          ? provisionError.message
          : "Unable to prepare workspace";
      setError(message);
      return;
    }

    setIsSubmitting(false);

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Card className="w-full max-w-md border-white/10 bg-[#111111] text-white ring-white/10">
      <CardHeader className="text-center">
        <CardTitle className="text-center text-xl font-medium tracking-tight">
          Sign in
        </CardTitle>
        <CardDescription className="text-center text-white/60">
          Access your NULLXES digital workforce workspace.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="border-white/10 bg-black/40 text-white"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
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
            disabled={isSubmitting}
            className="bg-white text-black hover:bg-white/90"
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </Button>
        </form>
        <p className="mt-6 text-sm text-white/60">
          No account?{" "}
          <Link href="/register" className="text-white hover:underline">
            Create one
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
