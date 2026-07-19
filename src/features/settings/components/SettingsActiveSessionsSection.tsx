"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  revokeAuthSessionAction,
  revokeOtherAuthSessionsAction,
} from "../actions/revoke-auth-sessions";
import { formatUserAgentLabel } from "../lib/format-user-agent";
import type { AuthSessionListItem } from "../types";

function formatSessionLabel(session: AuthSessionListItem): string {
  const agent = formatUserAgentLabel(session.userAgent);
  const ip = session.ipAddress ?? "unknown IP";
  return `${agent} · ${ip}`;
}

function formatRelativeTime(date: Date, locale: string): string {
  const diffMs = date.getTime() - Date.now();
  const diffSec = Math.round(diffMs / 1000);
  const absSec = Math.abs(diffSec);
  const rtf = new Intl.RelativeTimeFormat(locale === "ru" ? "ru" : "en", {
    numeric: "auto",
  });

  if (absSec < 60) return rtf.format(diffSec, "second");
  const diffMin = Math.round(diffSec / 60);
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, "minute");
  const diffHour = Math.round(diffMin / 60);
  if (Math.abs(diffHour) < 48) return rtf.format(diffHour, "hour");
  const diffDay = Math.round(diffHour / 24);
  return rtf.format(diffDay, "day");
}

export function SettingsActiveSessionsSection({
  sessions,
  currentSessionId,
}: {
  sessions: AuthSessionListItem[];
  currentSessionId: string | null;
}) {
  const t = useTranslations("settings.security.sessions");
  const locale = useLocale();
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
                {t("signedIn")}{" "}
                {formatRelativeTime(new Date(item.createdAt), locale)}
                {" · "}
                {new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "en-US", {
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
