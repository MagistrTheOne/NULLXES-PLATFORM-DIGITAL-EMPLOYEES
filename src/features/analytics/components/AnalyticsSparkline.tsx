import { cn } from "@/lib/utils";

/**
 * Minimal monochrome sparkline (B&W design language). Renders nothing when the
 * series has no signal so empty cards stay quiet.
 */
export function AnalyticsSparkline({
  data,
  className,
  width = 120,
  height = 32,
}: {
  data: number[];
  className?: string;
  width?: number;
  height?: number;
}) {
  const points = data.filter((value) => Number.isFinite(value));
  if (points.length < 2 || points.every((value) => value === 0)) {
    return null;
  }

  const max = Math.max(...points);
  const min = Math.min(...points);
  const span = max - min || 1;
  const stepX = width / (points.length - 1);

  const coords = points.map((value, index) => {
    const x = index * stepX;
    const y = height - ((value - min) / span) * height;
    return [x, y] as const;
  });

  const line = coords
    .map(([x, y], index) => `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");
  const area = `${line} L${width},${height} L0,${height} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={cn("h-8 w-full text-white/55", className)}
      aria-hidden
    >
      <path d={area} fill="currentColor" fillOpacity={0.08} />
      <path
        d={line}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
