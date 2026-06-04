import Link from "next/link";
import { requireAuth } from "@/features/auth/services/require-auth";

export default async function EmployeesPage() {
  await requireAuth();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-16">
      <h1 className="text-3xl font-medium tracking-tight">Employees</h1>
      <p className="text-white/60">
        Protected route placeholder. Employee UI is not part of this phase.
      </p>
      <Link href="/dashboard" className="text-sm text-white/80 hover:text-white">
        Back to dashboard
      </Link>
    </main>
  );
}
