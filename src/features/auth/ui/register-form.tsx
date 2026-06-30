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
import { Checkbox } from "@/components/ui/checkbox";
import { acceptInviteForNewUserAction } from "@/features/team/actions/accept-invite-for-new-user";
import { recordPersonalDataConsentAction } from "@/features/privacy/actions/personal-data-actions";
import type { OrganizationInvitePreview } from "@/features/team/services/lookup-organization-invite";
import type { OAuthProviderId } from "../lib/oauth-providers";
import { authClient } from "../client";
import { provisionDefaultWorkspace } from "../services/provision-default-workspace";
import { InviteAuthBanner } from "./invite-auth-banner";
import { OAuthSignInButtons } from "./oauth-sign-in-buttons";

export function RegisterForm({
  inviteToken,
  invite,
  oauthProviders,
}: {
  inviteToken: string | null;
  invite: OrganizationInvitePreview | null;
  oauthProviders: OAuthProviderId[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState(invite?.email ?? "");
  const [password, setPassword] = useState("");
  const [acceptedPersonalDataPolicy, setAcceptedPersonalDataPolicy] =
    useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!acceptedPersonalDataPolicy) {
      setError(
        "Please confirm consent to personal data processing before creating an account.",
      );
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
      setError(signUpError.message ?? "Unable to create account");
      return;
    }

    const userId = data?.user?.id;
    if (!userId) {
      setIsSubmitting(false);
      setError("Account was created without a user identifier");
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
      router.push(inviteToken ? `/login?invite=${inviteToken}` : "/login");
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
          {invite
            ? "Accept your workspace invite."
            : "Start operating digital employees at enterprise scale."}
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
              readOnly={Boolean(invite)}
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
              I agree to the processing of my personal data in accordance with
              the{" "}
              <Link
                href="/docs/personal-data"
                target="_blank"
                className="text-white underline underline-offset-4"
              >
                NULLXES personal data policy (152-FZ)
              </Link>
              .
            </Label>
          </div>
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
            {isSubmitting ? "Creating account..." : "Create account"}
          </Button>
        </form>
        <OAuthSignInButtons providers={oauthProviders} inviteToken={inviteToken} />
        <p className="mt-6 text-sm text-white/60">
          Already have an account?{" "}
          <Link
            href={inviteToken ? `/login?invite=${inviteToken}` : "/login"}
            className="text-white hover:underline"
          >
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
