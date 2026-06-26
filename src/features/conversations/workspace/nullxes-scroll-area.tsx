"use client";

import type { ReactNode } from "react";

export function NullxesScrollArea({ children }: { children?: ReactNode }) {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      {children}
    </div>
  );
}

export function NullxesMessageListWrapper({ children }: { children?: ReactNode }) {
  return (
    <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-black">
      {children}
    </div>
  );
}
