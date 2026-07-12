import { redirect } from "next/navigation";
import { getCurrentSession } from "@/features/auth/services/get-current-session";
import { getEnabledOAuthProviders } from "@/features/auth/lib/oauth-providers";
import {
  canShowRegisterForm,
  isPublicRegistrationEnabled,
} from "@/features/auth/lib/public-registration";
import { LoginForm } from "@/features/auth/ui/login-form";
import { AuthPageShell } from "@/features/auth/ui/auth-page-shell";
import { lookupOrganizationInviteByToken } from "@/features/team/services/lookup-organization-invite";

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
        registrationEnabled={canShowRegisterForm({ inviteToken })}
        registrationClosedHint={
          isPublicRegistrationEnabled()
            ? null
            : "Public registration is closed. Use an invite or approved email."
        }
      />
    </AuthPageShell>
  );
}
