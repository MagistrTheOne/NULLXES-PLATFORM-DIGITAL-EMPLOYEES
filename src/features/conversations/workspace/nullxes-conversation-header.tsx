"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Info, MoreHorizontal, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ConversationAvatar } from "../components/conversation-avatar";
import { EmployeePresenceBadge } from "../components/employee-presence";

export function NullxesConversationHeader({
  employeeId,
  name,
  role,
  departmentLabel,
  avatarPreviewUrl,
  avatarReady,
  online = true,
  detailsOpen,
  onToggleDetails,
  modelLabel,
}: {
  employeeId: string;
  name: string;
  role: string;
  departmentLabel?: string | null;
  avatarPreviewUrl?: string | null;
  avatarReady?: boolean;
  online?: boolean;
  detailsOpen?: boolean;
  onToggleDetails?: () => void;
  modelLabel?: string | null;
}) {
  const t = useTranslations("conversations");

  const metaParts = [role, departmentLabel, modelLabel].filter(Boolean);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-6 border-b border-white/6 px-6">
      <div className="flex min-w-0 items-center gap-4">
        <ConversationAvatar
          name={name}
          previewUrl={avatarPreviewUrl}
          ready={avatarReady}
          online={online}
          size="default"
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white">{name}</p>
          <p className="mt-0.5 flex items-center gap-2 truncate text-xs font-normal text-white/45">
            <EmployeePresenceBadge
              employeeId={employeeId}
              online={online}
              labelClassName="text-white/55"
            />
            {metaParts.length > 0 ? (
              <span className="truncate text-white/40">
                · {metaParts.join(" · ")}
              </span>
            ) : null}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="size-9 text-white/45 hover:bg-white/4 hover:text-white"
              asChild
            >
              <Link
                href={`/dashboard/employees/${employeeId}/talk`}
                aria-label={t("openTalk")}
              >
                <Video className="size-4 stroke-[1.5]" />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("openTalk")}</TooltipContent>
        </Tooltip>

        {onToggleDetails ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={onToggleDetails}
                aria-pressed={detailsOpen}
                className={cn(
                  "size-9 hover:bg-white/4 hover:text-white",
                  detailsOpen ? "bg-white/6 text-white" : "text-white/45",
                )}
                aria-label={
                  detailsOpen ? t("hideDetails") : t("showDetails")
                }
              >
                <Info className="size-4 stroke-[1.5]" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {detailsOpen ? t("hideDetails") : t("showDetails")}
            </TooltipContent>
          </Tooltip>
        ) : null}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="size-9 text-white/45 hover:bg-white/4 hover:text-white"
              aria-label={t("more")}
            >
              <MoreHorizontal className="size-4 stroke-[1.5]" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="border-white/8 bg-[#111111]">
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/employees/${employeeId}`}>
                {t("openProfile")}
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
