export default function EmployeeTalkLoading() {
  return (
    <div className="employee-talk-shell mx-auto flex min-h-[min(88dvh,920px)] w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a]">
      <div className="border-b border-white/8 px-4 py-3.5 lg:px-5">
        <div className="mb-2 h-3 w-16 animate-pulse rounded bg-white/5" />
        <div className="h-6 w-48 animate-pulse rounded-md bg-white/8" />
        <div className="mt-2 h-3 w-64 animate-pulse rounded bg-white/5" />
      </div>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-h-0 flex-col border-white/8 lg:border-r">
          <div
            className="aspect-video w-full animate-pulse bg-white/4 lg:min-h-[280px]"
            style={{ minHeight: "min(45dvh, 360px)" }}
          />
          <div className="min-h-[240px] flex-1 animate-pulse bg-white/3 lg:min-h-0" />
        </div>
        <div className="hidden min-h-0 animate-pulse bg-white/3 lg:block" />
      </div>
    </div>
  );
}
