"use client";

import { UserRound } from "lucide-react";
import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
} from "@/components/ui/avatar";
import { AvatarIdlePreview } from "@/features/employees/components/avatar-idle-preview";
import { cn } from "@/lib/utils";

export function ConversationAvatar({
  name,
  previewUrl,
  ready = true,
  online = false,
  size = "default",
  className,
}: {
  name: string;
  previewUrl?: string | null;
  ready?: boolean;
  online?: boolean;
  size?: "default" | "sm" | "lg";
  className?: string;
}) {
  const showPreview = Boolean(previewUrl && ready);

  return (
    <Avatar size={size} className={cn("bg-black", className)}>
      {showPreview ? (
        <span className="relative block size-full overflow-hidden rounded-full">
          <AvatarIdlePreview
            src={previewUrl!}
            alt={name}
            sizes={size === "lg" ? "40px" : size === "sm" ? "24px" : "32px"}
          />
        </span>
      ) : (
        <AvatarFallback className="rounded-full bg-black text-white/40">
          <UserRound className={size === "lg" ? "size-5" : "size-3.5"} />
        </AvatarFallback>
      )}
      {online ? (
        <AvatarBadge className="bg-white/70 ring-black" />
      ) : null}
    </Avatar>
  );
}
