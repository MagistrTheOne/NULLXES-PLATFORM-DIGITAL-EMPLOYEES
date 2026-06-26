"use client";

export function NullxesDateSeparator({ date }: { date?: Date | string }) {
  if (!date) {
    return null;
  }

  const label = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date instanceof Date ? date : new Date(date));

  return (
    <div className="flex items-center justify-center px-6 py-8">
      <span className="rounded-full border border-white/8 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-white/45">
        {label}
      </span>
    </div>
  );
}
