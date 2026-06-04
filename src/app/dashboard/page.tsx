import Link from "next/link";
import { requireAuth } from "@/features/auth/services/require-auth";
import { resolveWorkspace } from "@/features/workspace";

export default async function DashboardPage() {
  const session = await requireAuth();
  const workspace = await resolveWorkspace({ userId: session.user.id });

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-16">
      <div>
        <p className="text-xs tracking-[0.3em] text-white/50 uppercase">
          Workspace
        </p>
        <h1 className="mt-2 text-3xl font-medium tracking-tight">Dashboard</h1>
        <p className="mt-2 text-white/60">
          Signed in as {session.user.name} ({session.user.email})
        </p>
      </div>
      <section className="rounded-2xl border border-white/10 bg-[#111111] p-6">
        <p className="text-sm text-white/60">Active organization</p>
        <p className="mt-1 text-lg font-medium">{workspace.organization.name}</p>
        <p className="mt-4 text-sm text-white/60">Membership role</p>
        <p className="mt-1 capitalize">{workspace.membership.role}</p>
      </section>
      <nav className="flex flex-wrap gap-4 text-sm text-white/80">
        <Link href="/employees" className="hover:text-white">
          Employees
        </Link>
        <Link href="/settings" className="hover:text-white">
          Settings
        </Link>
        <Link href="/logout" className="hover:text-white">
          Sign out
        </Link>
      </nav>
    </main>
  );
}
