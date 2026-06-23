"use client";

import Image from "next/image";
import { UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { computeMaterializationVisual } from "../lib/compute-materialization-visual";

type EmployeeMaterializationPortraitProps = {
  src: string | null;
  alt: string;
  progress?: number;
  indeterminate?: boolean;
  isReady?: boolean;
  isFailed?: boolean;
  priority?: boolean;
  sizes?: string;
  className?: string;
};

export function EmployeeMaterializationPortrait({
  src,
  alt,
  progress = 0,
  indeterminate = false,
  isReady = false,
  isFailed = false,
  priority,
  sizes = "(max-width: 768px) 100vw, 448px",
  className,
}: EmployeeMaterializationPortraitProps) {
  const visual = computeMaterializationVisual(isReady ? 100 : progress);
  const showScan = !isReady && !isFailed;

  return (
    <div className={cn("relative size-full overflow-hidden bg-[#0a0a0a]", className)}>
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          unoptimized
          priority={priority}
          className={cn(
            "object-cover transition-[filter,opacity,transform] duration-700 ease-out",
            indeterminate && "animate-employee-materialize-pulse",
          )}
          style={
            indeterminate
              ? undefined
              : {
                  filter: `blur(${visual.blurPx}px)`,
                  opacity: visual.opacity,
                  transform: `scale(${visual.scale})`,
                }
          }
          sizes={sizes}
        />
      ) : (
        <div className="flex size-full items-center justify-center bg-white/3 text-white/30">
          <UserRound className="size-10 stroke-[1.25]" aria-hidden />
        </div>
      )}

      <div
        className="pointer-events-none absolute inset-0 bg-linear-to-b from-white/6 via-transparent to-black/35"
        aria-hidden
      />

      {showScan ? (
        <div
          className="pointer-events-none absolute inset-x-0 h-px bg-white/35 shadow-[0_0_24px_rgba(255,255,255,0.35)] animate-employee-materialize-scan"
          aria-hidden
        />
      ) : null}

      {isReady ? (
        <div
          className="pointer-events-none absolute inset-0 bg-white/8 opacity-0 animate-employee-materialize-flash"
          aria-hidden
        />
      ) : null}
    </div>
  );
}
