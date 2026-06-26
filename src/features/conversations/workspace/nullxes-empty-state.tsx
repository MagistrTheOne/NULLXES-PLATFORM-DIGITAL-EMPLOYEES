"use client";

import { MessageSquare } from "lucide-react";

export function NullxesEmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-full min-h-48 flex-col items-center justify-center gap-4 px-8 text-center">
      <MessageSquare className="size-10 stroke-[1.25] text-white/20" />
      <p className="max-w-sm text-sm font-normal leading-relaxed text-white/45">
        {message}
      </p>
    </div>
  );
}
