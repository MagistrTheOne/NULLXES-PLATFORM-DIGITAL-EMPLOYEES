import { redirect } from "next/navigation";
import { getCurrentSession } from "@/features/auth/services/get-current-session";
import { Verify2faForm } from "@/features/auth/ui/verify-2fa-form";

export default async function Verify2faPage() {
  const session = await getCurrentSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-full flex-1 items-center justify-center bg-black px-6 py-16">
      <div className="w-full max-w-md">
        <p className="mb-8 text-center text-xs tracking-[0.3em] text-white/50 uppercase">
          NULLXES Digital Employees
        </p>
        <Verify2faForm />
      </div>
    </main>
  );
}
