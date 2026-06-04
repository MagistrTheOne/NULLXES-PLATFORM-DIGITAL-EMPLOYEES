export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-medium tracking-tight text-white">
          Dashboard
        </h1>
        <p className="mt-2 text-sm text-white/60">
          Manage and operate your digital workforce.
        </p>
      </div>
      <section className="rounded-2xl border border-white/10 bg-[#111111] p-6">
        <p className="text-sm text-white/60">Workspace shell</p>
        <p className="mt-2 text-base text-white">
          Application layout is active. Employee and analytics modules are not
          part of this phase.
        </p>
      </section>
    </div>
  );
}
