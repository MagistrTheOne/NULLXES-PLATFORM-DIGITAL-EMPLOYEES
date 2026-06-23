export default function EmployeeDetailLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-9 w-20 animate-pulse rounded-md bg-white/6" />
          <div className="space-y-2">
            <div className="h-8 w-48 animate-pulse rounded-md bg-white/8" />
            <div className="h-4 w-36 animate-pulse rounded-md bg-white/5" />
          </div>
        </div>
        <div className="h-9 w-28 animate-pulse rounded-md bg-white/6" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="overflow-hidden rounded-xl border border-white/10 bg-[#111111]">
          <div className="aspect-4/3 animate-pulse bg-white/4" />
          <div className="space-y-3 p-5">
            <div className="h-6 w-20 animate-pulse rounded-full bg-white/6" />
            <div className="h-10 w-full animate-pulse rounded-md bg-white/8" />
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-10 w-full animate-pulse rounded-md bg-white/5" />
          <div className="h-64 animate-pulse rounded-xl border border-white/10 bg-white/3" />
        </div>
      </div>
    </div>
  );
}
