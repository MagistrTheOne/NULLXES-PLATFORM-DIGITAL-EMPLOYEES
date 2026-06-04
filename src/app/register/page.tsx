import { redirectIfAuthenticated } from "@/features/auth/services/redirect-if-authenticated";
import { RegisterForm } from "@/features/auth/ui/register-form";

export default async function RegisterPage() {
  await redirectIfAuthenticated();

  return (
    <main className="flex min-h-full flex-1 items-center justify-center bg-black px-6 py-16">
      <div className="w-full max-w-md">
        <p className="mb-8 text-center text-xs tracking-[0.3em] text-white/50 uppercase">
          NULLXES Digital Employees
        </p>
        <RegisterForm />
      </div>
    </main>
  );
}
