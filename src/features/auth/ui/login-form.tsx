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
import { acceptOrganizationInviteAction } from "@/features/team/actions/accept-organization-invite";
import type { OrganizationInvitePreview } from "@/features/team/services/lookup-organization-invite";
import type { OAuthProviderId } from "../lib/oauth-providers";
import { authClient } from "../client";
import { InviteAuthBanner } from "./invite-auth-banner";
import { OAuthSignInButtons } from "./oauth-sign-in-buttons";
import { AUTH_CARD_CLASS, AUTH_INPUT_CLASS } from "./auth-styles";

export function LoginForm({
  inviteToken,
  invite,
  oauthProviders,
  verified,
  reset,
}: {
  inviteToken: string | null;
  invite: OrganizationInvitePreview | null;
  oauthProviders: OAuthProviderId[];
  verified?: boolean;
  reset?: boolean;
}) {
  const t = useTranslations("auth.login");
  const tFields = useTranslations("auth.fields");
  const router = useRouter();
  const [email, setEmail] = useState(invite?.email ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const { data, error: signInError } = await authClient.signIn.email({
        email,
        password,
        rememberMe: true,
      });

      if (signInError) {
        if (signInError.status === 403) {
          router.push(`/login/verify-email?email=${encodeURIComponent(email.trim())}`);
          return;
        }
        setError(signInError.message ?? t("signInFailed"));
        return;
      }

      if (data && "twoFactorRedirect" in data && data.twoFactorRedirect) {
        router.push("/login/verify-2fa");
        router.refresh();
        return;
      }

      if (inviteToken) {
        const accepted = await acceptOrganizationInviteAction(inviteToken);
        if (!accepted.ok) {
          setError(accepted.message);
          return;
        }
      }

      router.push("/dashboard");
      router.refresh();
    } catch (submitError: unknown) {
      const message =
        submitError instanceof Error ? submitError.message : t("signInFailed");
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
          {invite ? t("inviteDescription") : t("description")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {verified ? (
          <p className="mb-4 text-sm text-white/70" role="status">
            {t("verifiedBanner")}
          </p>
        ) : null}
        {reset ? (
          <p className="mb-4 text-sm text-white/70" role="status">
            {t("resetBanner")}
          </p>
        ) : null}
        {invite ? (
          <InviteAuthBanner
            organizationName={invite.organizationName}
            role={invite.role}
            email={invite.email}
          />
        ) : null}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">{tFields("email")}</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              readOnly={Boolean(invite)}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={AUTH_INPUT_CLASS}
            />
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="password">{tFields("password")}</Label>
              <Link
                href="/login/forgot-password"
                className="text-xs text-white/60 hover:text-white hover:underline"
              >
                {t("forgotPassword")}
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
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
        <OAuthSignInButtons providers={oauthProviders} inviteToken={inviteToken} />
        <p className="mt-6 text-sm text-white/60">
          {t("noAccount")}{" "}
          <Link
            href={inviteToken ? `/register?invite=${inviteToken}` : "/register"}
            className="text-white hover:underline"
          >
            {t("createOne")}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
