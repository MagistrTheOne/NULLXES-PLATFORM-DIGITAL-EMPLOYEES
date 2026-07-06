import { redirect } from "next/navigation";
import { getCurrentSession } from "@/features/auth/services/get-current-session";
import { getEnabledOAuthProviders } from "@/features/auth/lib/oauth-providers";
import { RegisterForm } from "@/features/auth/ui/register-form";
import { AuthPageShell } from "@/features/auth/ui/auth-page-shell";
import { lookupOrganizationInviteByToken } from "@/features/team/services/lookup-organization-invite";

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

  const invite = inviteToken
    ? await lookupOrganizationInviteByToken(inviteToken)
    : null;

  return (
    <AuthPageShell>
      <RegisterForm
        inviteToken={inviteToken ?? null}
        invite={invite}
        oauthProviders={getEnabledOAuthProviders()}
      />
    </AuthPageShell>
  );
}
