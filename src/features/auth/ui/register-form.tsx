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
import { provisionDefaultWorkspace } from "../services/provision-default-workspace";

export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const { data, error: signUpError } = await authClient.signUp.email({
      name,
      email,
      password,
    });

    if (signUpError) {
      setIsSubmitting(false);
      setError(signUpError.message ?? "Unable to create account");
      return;
    }

    const userId = data?.user?.id;
    if (!userId) {
      setIsSubmitting(false);
      setError("Account was created without a user identifier");
      return;
    }

    try {
      await provisionDefaultWorkspace(userId, name);
    } catch (provisionError: unknown) {
      setIsSubmitting(false);
      const message =
        provisionError instanceof Error
          ? provisionError.message
          : "Unable to provision workspace";
      setError(message);
      return;
    }

    const { error: signInError } = await authClient.signIn.email({
      email,
      password,
      rememberMe: true,
    });

    setIsSubmitting(false);

    if (signInError) {
      setError(
        signInError.message ??
          "Account created. Sign in with your credentials.",
      );
      router.push("/login");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Card className="w-full max-w-md border-white/10 bg-[#111111] text-white ring-white/10">
      <CardHeader>
        <CardTitle className="text-xl font-medium tracking-tight">
          Create account
        </CardTitle>
        <CardDescription className="text-white/60">
          Start operating digital employees at enterprise scale.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="border-white/10 bg-black/40 text-white"
            />
          </div>
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
              autoComplete="new-password"
              required
              minLength={8}
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
            {isSubmitting ? "Creating account..." : "Create account"}
          </Button>
        </form>
        <p className="mt-6 text-sm text-white/60">
          Already have an account?{" "}
          <Link href="/login" className="text-white hover:underline">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
