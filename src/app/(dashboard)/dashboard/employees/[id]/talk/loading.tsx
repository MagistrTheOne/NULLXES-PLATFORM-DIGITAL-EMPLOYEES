export default function EmployeeTalkLoading() {
  return (
    <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-5 px-4 pb-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <div className="h-9 w-20 animate-pulse rounded-md bg-white/6" />
          <div className="space-y-2">
            <div className="h-8 w-48 animate-pulse rounded-md bg-white/8" />
            <div className="h-4 w-64 animate-pulse rounded-md bg-white/5" />
          </div>
        </div>
        <div className="h-8 w-36 animate-pulse rounded-full bg-white/6" />
      </div>

      <div className="grid min-h-0 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <div className="aspect-video min-h-[320px] w-full animate-pulse rounded-xl bg-white/4" />
          <div className="flex justify-center gap-3 py-4">
            <div className="h-11 w-36 animate-pulse rounded-full bg-white/8" />
            <div className="h-11 w-24 animate-pulse rounded-full bg-white/6" />
          </div>
        </div>
        <div className="min-h-[320px] animate-pulse rounded-xl border border-white/10 bg-white/3 lg:min-h-0" />
      </div>
    </div>
  );
}
