import { redirect } from "next/navigation";
import { getCurrentSession } from "@/features/auth/services/get-current-session";
import { LoginForm } from "@/features/auth/ui/login-form";
import { lookupOrganizationInviteByToken } from "@/features/team/services/lookup-organization-invite";

export default async function LoginPage({
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
    <main className="flex min-h-full flex-1 items-center justify-center bg-black px-6 py-16">
      <div className="w-full max-w-md">
        <p className="mb-8 text-center text-xs tracking-[0.3em] text-white/50 uppercase">
          NULLXES Digital Employees
        </p>
        <LoginForm inviteToken={inviteToken ?? null} invite={invite} />
      </div>
    </main>
  );
}
