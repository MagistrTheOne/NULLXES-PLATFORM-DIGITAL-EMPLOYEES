export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        <div className="h-8 w-40 animate-pulse rounded-md bg-white/8" />
        <div className="h-4 w-64 animate-pulse rounded-md bg-white/5" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-28 animate-pulse rounded-xl border border-white/10 bg-white/3"
          />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-xl border border-white/10 bg-white/3" />
    </div>
  );
}
