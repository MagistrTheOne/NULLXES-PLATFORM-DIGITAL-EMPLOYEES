import { redirect } from "next/navigation";
import { getCurrentSession } from "@/features/auth/services/get-current-session";
import { acceptOrganizationInviteAction } from "@/features/team/actions/accept-organization-invite";
import { lookupOrganizationInviteByToken } from "@/features/team/services/lookup-organization-invite";

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string }>;
}) {
  const { invite: token } = await searchParams;

  if (!token) {
    redirect("/dashboard");
  }

  const preview = await lookupOrganizationInviteByToken(token);
  if (!preview) {
    redirect("/login?error=invalid_invite");
  }

  const session = await getCurrentSession();
  if (!session) {
    redirect(`/login?invite=${encodeURIComponent(token)}`);
  }

  const result = await acceptOrganizationInviteAction(token);

  if (!result.ok) {
    redirect(`/settings?error=${encodeURIComponent(result.message)}`);
  }

  redirect("/dashboard");
}
