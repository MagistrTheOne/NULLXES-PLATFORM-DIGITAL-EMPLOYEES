import type { ReactNode } from "react";
import {
  platformPageShellClass,
  type PLATFORM_MAX_WIDTH,
} from "@/shared/layout/platform-layout";

export function PlatformPageShell({
  children,
  width = "wide",
  className,
}: {
  children: ReactNode;
  width?: keyof typeof PLATFORM_MAX_WIDTH;
  className?: string;
}) {
  return (
    <div className={platformPageShellClass({ width, className })}>
      {children}
    </div>
  );
}
