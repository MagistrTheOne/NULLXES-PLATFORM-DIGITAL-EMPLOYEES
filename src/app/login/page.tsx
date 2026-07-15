import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/features/auth/services/get-current-session";
import { getEnabledOAuthProviders } from "@/features/auth/lib/oauth-providers";
import { LoginForm } from "@/features/auth/ui/login-form";
import { AuthPageShell } from "@/features/auth/ui/auth-page-shell";
import { lookupOrganizationInviteByToken } from "@/features/team/services/lookup-organization-invite";
import { buildPageMetadata } from "@/shared/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Sign in",
  description: "Sign in to NULLXES Digital Employees.",
  path: "/login",
  noIndex: true,
});

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string; verified?: string; reset?: string }>;
}) {
  const { invite: inviteToken, verified, reset } = await searchParams;
  const session = await getCurrentSession();

  if (session && inviteToken) {
    redirect(`/accept-invite?invite=${encodeURIComponent(inviteToken)}`);
  }

  if (session) {
    redirect("/dashboard");
  }

  const invite = inviteToken
    ? await lookupOrganizationInviteByToken(inviteToken)
    : null;

  return (
    <AuthPageShell>
      <LoginForm
        inviteToken={inviteToken ?? null}
        invite={invite}
        oauthProviders={getEnabledOAuthProviders()}
        verified={verified === "1"}
        reset={reset === "1"}
      />
    </AuthPageShell>
  );
}
