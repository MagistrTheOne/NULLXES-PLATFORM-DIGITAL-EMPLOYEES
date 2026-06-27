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
    <div className="nullxes-message-list-wrapper relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-black">
      {/* Force the inner Stream message list (or custom content) to be the scroller.
          This prevents the whole chat/page from shifting down when messages load or composer changes. */}
      <div className="flex-1 overflow-y-auto [scrollbar-gutter:stable]">
        {children}
      </div>
    </div>
  );
}
