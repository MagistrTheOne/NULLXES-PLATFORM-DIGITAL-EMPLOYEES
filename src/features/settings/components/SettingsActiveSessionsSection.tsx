"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  revokeAuthSessionAction,
  revokeOtherAuthSessionsAction,
} from "../actions/revoke-auth-sessions";
import type { AuthSessionListItem } from "../types";

function formatSessionLabel(session: AuthSessionListItem): string {
  const agent = session.userAgent?.split(" ")[0] ?? "Unknown device";
  const ip = session.ipAddress ?? "unknown IP";
  return `${agent} · ${ip}`;
}

export function SettingsActiveSessionsSection({
  sessions,
  currentSessionId,
}: {
  sessions: AuthSessionListItem[];
  currentSessionId: string | null;
}) {
  const t = useTranslations("settings.security.sessions");
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleRevoke(sessionId: string): void {
    startTransition(async () => {
      const result = await revokeAuthSessionAction(sessionId);
      setMessage(result.ok ? t("revoked") : result.message);
      if (result.ok) {
        router.refresh();
      }
    });
  }

  function handleRevokeOthers(): void {
    if (!currentSessionId) {
      return;
    }

    startTransition(async () => {
      const result = await revokeOtherAuthSessionsAction(currentSessionId);
      if (!result.ok) {
        setMessage(result.message);
        return;
      }
      setMessage(t("revokedOthers", { count: result.revokedCount }));
      router.refresh();
    });
  }

  if (sessions.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-3">
      <ul className="space-y-2">
        {sessions.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background/40 px-4 py-3 text-sm"
          >
            <div className="min-w-0">
              <p className="truncate text-foreground">
                {formatSessionLabel(item)}
                {item.isCurrent ? (
                  <span className="ml-2 text-xs text-muted-foreground">
                    ({t("current")})
                  </span>
                ) : null}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Intl.DateTimeFormat(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(new Date(item.createdAt))}
              </p>
            </div>
            {!item.isCurrent ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() => handleRevoke(item.id)}
              >
                {t("revoke")}
              </Button>
            ) : null}
          </li>
        ))}
      </ul>
      {sessions.length > 1 && currentSessionId ? (
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={handleRevokeOthers}
        >
          {t("revokeOthers")}
        </Button>
      ) : null}
      {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
    </div>
  );
}
