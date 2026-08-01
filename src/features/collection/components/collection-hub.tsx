"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { CapsulesScreen } from "@/features/capsules/components/capsules-screen";
import type { CapsuleHistoryItem } from "@/features/capsules/lib/history";
import { CollectionScreen } from "@/features/collection/components/collection-screen";
import { InventoryScreen } from "@/features/inventory/components/inventory-screen";
import type {
  CapsuleOffer,
  RewardItem,
} from "@/features/rewards/lib/catalog";
import type { EmployeeLoadout } from "@/features/rewards/lib/loadout";
import { cn } from "@/lib/utils";

export type CollectionHubTab = "capsules" | "catalog" | "inventory";

const TABS: CollectionHubTab[] = ["capsules", "catalog", "inventory"];

function resolveTab(raw: string | null): CollectionHubTab {
  if (raw === "capsules" || raw === "inventory" || raw === "catalog") {
    return raw;
  }
  return "catalog";
}

type Props = {
  offers: CapsuleOffer[];
  rewards: RewardItem[];
  dailySecondsLeft: number;
  history: CapsuleHistoryItem[];
  employees: Array<{ id: string; name: string }>;
  loadouts: Record<string, EmployeeLoadout>;
};

export function CollectionHub({
  offers,
  rewards,
  dailySecondsLeft,
  history,
  employees,
  loadouts,
}: Props) {
  const t = useTranslations("common.nav");
  const searchParams = useSearchParams();
  const tab = resolveTab(searchParams.get("tab"));

  return (
    <div className="min-h-full bg-[#121212] text-white">
      <div className="border-b border-white/10 px-4 pt-4 sm:px-6">
        <div className="flex gap-1 overflow-x-auto pb-3">
          {TABS.map((id) => {
            const href =
              id === "catalog"
                ? "/dashboard/collection"
                : `/dashboard/collection?tab=${id}`;
            const active = tab === id;
            return (
              <Link
                key={id}
                href={href}
                className={cn(
                  "shrink-0 rounded-md px-3 py-1.5 text-sm transition-colors",
                  active
                    ? "bg-white/10 text-white"
                    : "text-white/50 hover:bg-white/5 hover:text-white/80",
                )}
              >
                {t(
                  id === "capsules"
                    ? "capsules"
                    : id === "inventory"
                      ? "inventory"
                      : "collectionCatalog",
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {tab === "capsules" ? (
        <CapsulesScreen
          offers={offers}
          rewards={rewards}
          dailySecondsLeft={dailySecondsLeft}
          history={history}
        />
      ) : null}
      {tab === "catalog" ? <CollectionScreen rewards={rewards} /> : null}
      {tab === "inventory" ? (
        <InventoryScreen
          rewards={rewards}
          offers={offers}
          employees={employees}
          loadouts={loadouts}
        />
      ) : null}
    </div>
  );
}
