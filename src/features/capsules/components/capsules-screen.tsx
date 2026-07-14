"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Hexagon, History, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  getRewardById,
  MOCK_CAPSULE_OFFERS,
  RARITY_ODDS,
  RARITY_STYLES,
  type CapsuleTierId,
} from "@/features/rewards/lib/catalog";
import {
  rewardsPrimaryButtonClass,
  rewardsWorkspaceClass,
} from "@/features/rewards/lib/workspace-shell";
import { CapsulesAmbienceToggle } from "./capsules-ambience";

const TABS = [
  { id: "featured", label: "Featured" },
  { id: "all", label: "All Capsules" },
  { id: "mine", label: "My Capsules (3)" },
  { id: "daily", label: "Daily Free" },
] as const;

function formatCountdown(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");
}

function CapsuleVisual({ tier }: { tier: CapsuleTierId }) {
  const ring =
    tier === "executive"
      ? "from-amber-200/30 via-white/10 to-transparent"
      : tier === "standard"
        ? "from-amber-200/20 via-white/8 to-transparent"
        : "from-white/20 via-white/5 to-transparent";

  return (
    <div className="relative mx-auto flex h-48 w-28 items-center justify-center sm:h-56 sm:w-32">
      <div
        className={cn(
          "absolute inset-0 rounded-[2rem] bg-linear-to-b opacity-90 blur-2xl",
          ring,
        )}
      />
      <div
        className={cn(
          "relative h-44 w-20 rounded-[999px] border border-white/15 bg-linear-to-b from-[#2a2a2a] to-[#0c0c0c] shadow-[0_24px_60px_rgba(0,0,0,0.55)] sm:h-52 sm:w-24",
          tier === "executive" &&
            "border-amber-200/35 from-[#2a2418] to-[#0a0804]",
          tier === "standard" && "border-amber-200/25",
        )}
      >
        <div className="absolute inset-x-3 top-8 h-px bg-white/20" />
        <div className="absolute inset-x-4 top-1/2 h-px -translate-y-1/2 bg-white/15" />
        <div className="absolute inset-x-3 bottom-10 h-px bg-white/15" />
        <div className="absolute top-1/2 left-1/2 size-6 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-black/40" />
      </div>
    </div>
  );
}

export function CapsulesScreen() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("featured");
  const [toast, setToast] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(19 * 3600 + 32 * 60 + 45);

  useEffect(() => {
    const id = window.setInterval(() => {
      setSecondsLeft((value) => (value > 0 ? value - 1 : 0));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const featured = useMemo(
    () =>
      ["exec-black", "neg-mastery", "calm-voice", "board-room"]
        .map((id) => getRewardById(id))
        .filter(Boolean),
    [],
  );

  function onActivate(tier: CapsuleTierId, claimed?: boolean) {
    if (claimed) {
      setToast("Daily capsule already claimed. Next drop when the timer ends.");
      return;
    }
    setToast(
      tier === "standard" || tier === "executive"
        ? "Activate is a UI stub — payment and server drop come next."
        : "Claim stub ready.",
    );
  }

  return (
    <div className={rewardsWorkspaceClass()}>
      <div className="flex w-full flex-1 flex-col gap-6 lg:gap-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-medium tracking-[0.18em] text-white uppercase sm:text-3xl">
              Capsules
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-white/50">
              Activate capsules and unlock rewards for your digital employees.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <CapsulesAmbienceToggle />
            <Button
              type="button"
              variant="outline"
              className="border-white/12 bg-white/5 text-white/80 hover:bg-white/10"
              onClick={() => setToast("Capsule history — coming soon.")}
            >
              <History className="size-4" />
              Capsule history
            </Button>
          </div>
        </header>

        {toast ? (
          <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/60">
            {toast}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2 border-b border-white/8 pb-3">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-xs tracking-wide transition-colors",
                tab === item.id
                  ? "bg-white text-black"
                  : "text-white/50 hover:bg-white/5 hover:text-white/80",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="grid w-full gap-6 xl:grid-cols-[minmax(0,1fr)_300px] xl:gap-8">
          <ul className="grid w-full grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">
            {MOCK_CAPSULE_OFFERS.map((offer) => (
              <li key={offer.id} className="min-w-0">
                <article className="flex h-full flex-col rounded-2xl border border-white/10 bg-[#1a1a1a] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] tracking-[0.2em] text-white/40 uppercase">
                        {offer.id === "daily" ? "Daily" : "Capsule"}
                      </p>
                      <h2 className="mt-1 text-lg font-medium text-white">
                        {offer.name}
                      </h2>
                    </div>
                    <span className="rounded-full border border-white/12 px-2.5 py-1 font-mono text-xs text-white/70">
                      {offer.priceLabel}
                    </span>
                  </div>

                  <CapsuleVisual tier={offer.id} />

                  <p className="mt-2 text-sm leading-relaxed text-white/45">
                    {offer.blurb}
                  </p>

                  {offer.claimed ? (
                    <p className="mt-3 font-mono text-xs text-white/40">
                      Next in {formatCountdown(secondsLeft)} · 1/1
                    </p>
                  ) : null}

                  <div className="mt-4 flex flex-wrap gap-2">
                    {offer.rewardPreviewIds.map((id) => {
                      const reward = getRewardById(id);
                      if (!reward) return null;
                      const style = RARITY_STYLES[reward.rarity];
                      return (
                        <span
                          key={id}
                          className={cn(
                            "inline-flex size-8 items-center justify-center rounded-lg border bg-black/40",
                            style.border,
                          )}
                          title={reward.name}
                        >
                          <Hexagon className={cn("size-3.5", style.text)} />
                        </span>
                      );
                    })}
                  </div>

                  <Button
                    type="button"
                    disabled={offer.claimed}
                    onClick={() => onActivate(offer.id, offer.claimed)}
                    className={cn(
                      "mt-auto pt-5",
                      offer.claimed
                        ? "h-10 w-full rounded-xl border border-white/10 bg-white/5 text-white/40"
                        : rewardsPrimaryButtonClass,
                    )}
                  >
                    {offer.activateLabel}
                  </Button>
                </article>
              </li>
            ))}
          </ul>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-[#1a1a1a] p-5">
              <h3 className="text-sm font-medium text-white">Capsules explained</h3>
              <ul className="mt-4 space-y-3 text-sm text-white/50">
                <li>
                  <span className="text-white/80">Activate</span> — unlock one reward
                </li>
                <li>
                  <span className="text-white/80">Collect</span> — chips, outfits, voices
                </li>
                <li>
                  <span className="text-white/80">Equip</span> — apply to a digital employee
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#1a1a1a] p-5">
              <h3 className="text-sm font-medium text-white">Rarity chances</h3>
              <ul className="mt-4 space-y-2.5">
                {RARITY_ODDS.map((row) => (
                  <li
                    key={row.rarity}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className={cn(
                          "size-1.5 rounded-full",
                          row.rarity === "core" && "bg-white/50",
                          row.rarity === "professional" && "bg-emerald-400",
                          row.rarity === "premium" && "bg-sky-400",
                          row.rarity === "executive" && "bg-violet-400",
                          row.rarity === "founders" && "bg-amber-400",
                        )}
                      />
                      <span className={RARITY_STYLES[row.rarity].text}>
                        {RARITY_STYLES[row.rarity].label}
                      </span>
                    </span>
                    <span className="font-mono text-white/45">{row.percent}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-amber-400/25 bg-[#1a1a1a] p-5">
              <p className="text-[10px] tracking-[0.18em] text-amber-300/80 uppercase">
                Best value
              </p>
              <h3 className="mt-2 text-sm font-medium text-white">
                10× Executive Capsules
              </h3>
              <p className="mt-1 font-mono text-sm text-white/55">44 990 ₽</p>
              <Button
                type="button"
                className={cn("mt-4", rewardsPrimaryButtonClass)}
                onClick={() => setToast("Bundle checkout — coming with billing.")}
              >
                View bundle
              </Button>
            </div>
          </aside>
        </div>

        <section className="w-full border-t border-white/8 pt-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-white/40" />
              <h3 className="text-sm font-medium tracking-wide text-white/80 uppercase">
                Featured rewards
              </h3>
            </div>
            <Link
              href="/dashboard/inventory"
              className="inline-flex items-center gap-1 text-xs text-white/45 transition-colors hover:text-white/80"
            >
              View all rewards
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
            {featured.map((item) => {
              if (!item) return null;
              const style = RARITY_STYLES[item.rarity];
              return (
                <li key={item.id}>
                  <Link
                    href={`/dashboard/inventory?item=${item.id}`}
                    className={cn(
                      "flex h-full flex-col rounded-xl border bg-[#1a1a1a] p-4 transition-colors hover:bg-[#1f1f1f]",
                      style.border,
                    )}
                  >
                    <p
                      className={cn(
                        "text-[10px] tracking-[0.18em] uppercase",
                        style.text,
                      )}
                    >
                      {style.label}
                    </p>
                    <Hexagon className={cn("mt-3 size-8", style.text)} />
                    <p className="mt-3 text-sm text-white">{item.name}</p>
                    <p className="mt-1 text-[11px] text-white/40">{item.type.replace("_", " ")}</p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}
