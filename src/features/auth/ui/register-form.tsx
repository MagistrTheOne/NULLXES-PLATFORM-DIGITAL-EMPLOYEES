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
import { Checkbox } from "@/components/ui/checkbox";
import { acceptInviteForNewUserAction } from "@/features/team/actions/accept-invite-for-new-user";
import { recordPersonalDataConsentAction } from "@/features/privacy/actions/personal-data-actions";
import type { OrganizationInvitePreview } from "@/features/team/services/lookup-organization-invite";
import type { OAuthProviderId } from "../lib/oauth-providers";
import { authClient } from "../client";
import { provisionDefaultWorkspace } from "../services/provision-default-workspace";
import { InviteAuthBanner } from "./invite-auth-banner";
import { OAuthSignInButtons } from "./oauth-sign-in-buttons";
import { AUTH_CARD_CLASS, AUTH_INPUT_CLASS } from "./auth-styles";

export function RegisterForm({
  inviteToken,
  invite,
  oauthProviders,
}: {
  inviteToken: string | null;
  invite: OrganizationInvitePreview | null;
  oauthProviders: OAuthProviderId[];
}) {
  const t = useTranslations("auth.register");
  const tFields = useTranslations("auth.fields");
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState(invite?.email ?? "");
  const [password, setPassword] = useState("");
  const [acceptedPersonalDataPolicy, setAcceptedPersonalDataPolicy] =
    useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setInfo(null);

    if (!acceptedPersonalDataPolicy) {
      setError(t("consentRequired"));
      return;
    }

    setIsSubmitting(true);

    const { data, error: signUpError } = await authClient.signUp.email({
      name,
      email,
      password,
    });

    if (signUpError) {
      setIsSubmitting(false);
      setError(signUpError.message ?? t("signUpFailed"));
      return;
    }

    const userId = data?.user?.id;
    if (!userId) {
      setIsSubmitting(false);
      setError(t("noUserId"));
      return;
    }

    let organizationId: string | null = null;

    try {
      if (inviteToken) {
        const accepted = await acceptInviteForNewUserAction({
          token: inviteToken,
          userId,
          email,
        });
        if (!accepted.ok) {
          throw new Error(accepted.message);
        }
        organizationId = accepted.organizationId;
      } else {
        const provisioned = await provisionDefaultWorkspace(userId, name);
        organizationId = provisioned.organizationId;
      }

      const consent = await recordPersonalDataConsentAction({
        userId,
        organizationId,
      });
      if (!consent.ok) {
        throw new Error(consent.message);
      }
    } catch (provisionError: unknown) {
      setIsSubmitting(false);
      const message =
        provisionError instanceof Error
          ? provisionError.message
          : t("provisionFailed");
      setError(message);
      return;
    }

    setIsSubmitting(false);

    if (!data.user.emailVerified) {
      setInfo(t("checkEmail"));
      router.push(`/login/verify-email?email=${encodeURIComponent(email.trim())}`);
      return;
    }

    const { error: signInError } = await authClient.signIn.email({
      email,
      password,
      rememberMe: true,
    });

    if (signInError) {
      setError(signInError.message ?? t("signUpFailed"));
      router.push(inviteToken ? `/login?invite=${inviteToken}` : "/login");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Card className={AUTH_CARD_CLASS}>
      <CardHeader>
        <CardTitle className="text-xl font-medium tracking-tight">
          {t("title")}
        </CardTitle>
        <CardDescription className="text-white/60">
          {invite ? t("inviteDescription") : t("description")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {invite ? (
          <InviteAuthBanner
            organizationName={invite.organizationName}
            role={invite.role}
            email={invite.email}
          />
        ) : null}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">{tFields("name")}</Label>
            <Input
              id="name"
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={AUTH_INPUT_CLASS}
            />
          </div>
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
            <Label htmlFor="password">{tFields("password")}</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={AUTH_INPUT_CLASS}
            />
          </div>
          <div className="flex items-start gap-3 rounded-lg border border-white/10 bg-black/30 p-3">
            <Checkbox
              id="personal-data-consent"
              checked={acceptedPersonalDataPolicy}
              onCheckedChange={(checked) =>
                setAcceptedPersonalDataPolicy(checked === true)
              }
              className="mt-0.5 border-white/20 data-[state=checked]:border-white data-[state=checked]:bg-white data-[state=checked]:text-black"
            />
            <Label
              htmlFor="personal-data-consent"
              className="text-sm leading-relaxed font-normal text-white/70"
            >
              {t.rich("consent", {
                policy: () => (
                  <Link
                    href="/docs/personal-data"
                    target="_blank"
                    className="text-white underline underline-offset-4"
                  >
                    {t("policyLink")}
                  </Link>
                ),
              })}
            </Label>
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
            disabled={isSubmitting || !acceptedPersonalDataPolicy}
            className="bg-white text-black hover:bg-white/90"
          >
            {isSubmitting ? t("submitting") : t("submit")}
          </Button>
        </form>
        <OAuthSignInButtons providers={oauthProviders} inviteToken={inviteToken} />
        <p className="mt-6 text-sm text-white/60">
          {t("hasAccount")}{" "}
          <Link
            href={inviteToken ? `/login?invite=${inviteToken}` : "/login"}
            className="text-white hover:underline"
          >
            {t("signIn")}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
