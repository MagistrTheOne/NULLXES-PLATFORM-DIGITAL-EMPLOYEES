export function InviteAuthBanner({
  organizationName,
  role,
  email,
}: {
  organizationName: string;
  role: string;
  email: string;
}) {
  return (
    <div className="mb-6 rounded-xl border border-white/10 bg-white/4 px-4 py-3 text-sm text-white/80">
      <p>
        You are joining <span className="text-white">{organizationName}</span> as{" "}
        <span className="capitalize text-white">{role}</span>.
      </p>
      <p className="mt-1 text-white/55">Use {email} to accept this invite.</p>
    </div>
  );
}
