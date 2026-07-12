import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/features/auth/services/get-current-session";
import { getEnabledOAuthProviders } from "@/features/auth/lib/oauth-providers";
import { isPublicRegistrationEnabled } from "@/features/auth/lib/public-registration";
import { isRequireEmailVerificationEnabled } from "@/features/auth/lib/require-email-verification";
import { RegisterForm } from "@/features/auth/ui/register-form";
import { AuthPageShell } from "@/features/auth/ui/auth-page-shell";
import { lookupOrganizationInviteByToken } from "@/features/team/services/lookup-organization-invite";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AUTH_CARD_CLASS } from "@/features/auth/ui/auth-styles";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string }>;
}) {
  const { invite: inviteToken } = await searchParams;
  const session = await getCurrentSession();

  if (session && inviteToken) {
    redirect(`/accept-invite?invite=${encodeURIComponent(inviteToken)}`);
  }

  if (session) {
    redirect("/dashboard");
  }

  if (!isPublicRegistrationEnabled()) {
    return (
      <AuthPageShell>
        <Card className={AUTH_CARD_CLASS}>
          <CardHeader>
            <CardTitle className="text-white">Registration paused</CardTitle>
            <CardDescription className="text-white/60">
              Public sign-up is temporarily closed while acquiring is being
              connected. Existing accounts (CEO, team, auditors) can still sign
              in.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button asChild className="bg-white text-black hover:bg-white/90">
              <Link href="/login">Go to sign in</Link>
            </Button>
            <p className="text-xs text-white/45">
              Need access? Contact{" "}
              <a
                href="mailto:ceo@nullxes.com"
                className="text-white/70 underline underline-offset-2"
              >
                ceo@nullxes.com
              </a>
              .
            </p>
          </CardContent>
        </Card>
      </AuthPageShell>
    );
  }

  const invite = inviteToken
    ? await lookupOrganizationInviteByToken(inviteToken)
    : null;

  return (
    <AuthPageShell>
      <RegisterForm
        inviteToken={inviteToken ?? null}
        invite={invite}
        oauthProviders={getEnabledOAuthProviders()}
        requireEmailVerification={isRequireEmailVerificationEnabled()}
      />
    </AuthPageShell>
  );
}
