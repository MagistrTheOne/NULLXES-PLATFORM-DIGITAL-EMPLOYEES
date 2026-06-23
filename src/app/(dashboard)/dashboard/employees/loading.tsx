export default function EmployeesLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        <div className="h-8 w-52 animate-pulse rounded-md bg-white/8" />
        <div className="h-4 w-72 animate-pulse rounded-md bg-white/5" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-xl border border-white/10 bg-[#111111]"
          >
            <div className="aspect-4/3 animate-pulse bg-white/4" />
            <div className="space-y-3 p-5">
              <div className="h-5 w-32 animate-pulse rounded bg-white/8" />
              <div className="h-4 w-24 animate-pulse rounded bg-white/5" />
              <div className="h-9 w-full animate-pulse rounded-md bg-white/6" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
