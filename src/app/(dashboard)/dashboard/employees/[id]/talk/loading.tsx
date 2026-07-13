export default function EmployeeTalkLoading() {
  return (
    <div className="employee-talk-shell mx-auto flex h-full max-h-[calc(100dvh-3.5rem)] min-h-0 w-full flex-1 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a]">
      <div className="border-b border-white/8 px-4 py-3.5 lg:px-5">
        <div className="mb-2 h-3 w-16 animate-pulse rounded bg-white/5" />
        <div className="h-6 w-48 animate-pulse rounded-md bg-white/8" />
        <div className="mt-2 h-3 w-64 animate-pulse rounded bg-white/5" />
      </div>

      <div className="talk-stage-frame flex min-h-0 flex-1 bg-black px-3 py-3">
        <div className="talk-workspace-stage animate-pulse bg-white/4" />
      </div>
    </div>
  );
}
