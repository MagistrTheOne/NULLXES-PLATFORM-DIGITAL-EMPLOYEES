"use client";

import { useTranslations } from "next-intl";
import { UserRound } from "lucide-react";

export type TalkViewer = {
  name: string;
  image: string | null;
  role: "owner" | "admin" | "operator" | "viewer";
};

/**
 * The signed-in operator ("You") rendered from the workspace DB user. Mirrors
 * the employee identity card so the conversation reads as a two-party thread.
 */
export function TalkViewerCard({ viewer }: { viewer: TalkViewer }) {
  const t = useTranslations("employees.talk.viewer");

  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-white/8 bg-white/3 px-3 py-2.5">
      <span className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-black">
        {viewer.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={viewer.image}
            alt={viewer.name}
            className="size-full object-cover"
          />
        ) : (
          <UserRound className="size-4 text-white/40" />
        )}
        <span className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full border border-[#0a0a0a] bg-emerald-400" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-medium text-white">
          {viewer.name}
        </span>
        <span className="block truncate text-[10px] text-white/40">
          {t(`role.${viewer.role}`)}
        </span>
      </span>
      <span className="rounded-full bg-white/8 px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.12em] text-white/55">
        {t("you")}
      </span>
    </div>
  );
}
