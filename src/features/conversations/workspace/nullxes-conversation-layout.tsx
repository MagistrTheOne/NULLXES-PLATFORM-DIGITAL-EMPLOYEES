"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function NullxesConversationLayout({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "nullxes-conversation-layout flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-black",
        className,
      )}
    >
      {children}
    </div>
  );
}
