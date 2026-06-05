"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/features/auth/client";
import { createApiKeyAction } from "@/features/security/actions/create-api-key";
import type { SecuritySnapshot } from "../types";
import { SettingsCard } from "./settings-card";

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background/40 px-4 py-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}

export function SettingsSecurityTab({
  security,
  canManageOrganization,
}: {
  security: SecuritySnapshot;
  canManageOrganization: boolean;
}) {
  const t = useTranslations("settings.security");
  const [keyName, setKeyName] = useState("Production API");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCreateKey(): void {
    startTransition(async () => {
      const result = await createApiKeyAction({ name: keyName });
      if (!result.ok) {
        setMessage(result.message);
        return;
      }
      setCreatedKey(result.rawKey);
      setMessage(t("copyKeyNow"));
    });
  }

  function handleEnable2fa(): void {
    startTransition(async () => {
      const password = window.prompt(t("passwordPrompt"));
      if (!password) {
        return;
      }
      const result = await authClient.twoFactor.enable({ password });
      if (result.error) {
        setMessage(result.error.message ?? t("enable2faFailed"));
        return;
      }
      setMessage(t("totpSetup"));
    });
  }

  return (
    <div className="grid gap-6">
      <SettingsCard title={t("authentication")} description={t("authenticationDesc")}>
        <div className="grid gap-3">
          <StatusRow
            label={t("twoFactor")}
            value={security.twoFactorEnabled ? t("enabled") : t("notEnabled")}
          />
          <StatusRow
            label={t("activeSessions")}
            value={t("devices", { count: security.activeAuthSessions })}
          />
          <StatusRow label={t("sessionTimeout")} value={t("sessionTimeoutValue")} />
          {!security.twoFactorEnabled ? (
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={handleEnable2fa}
            >
              {t("enable2fa")}
            </Button>
          ) : null}
        </div>
      </SettingsCard>
      <SettingsCard title={t("apiAccess")}>
        <div className="grid gap-3">
          <StatusRow
            label={t("apiKeys")}
            value={security.apiKeysConfigured ? t("configured") : t("notConfigured")}
          />
          <StatusRow label={t("ipAllowlist")} value={t("ipAllowlistDisabled")} />
          {canManageOrganization ? (
            <div className="flex flex-wrap items-end gap-3">
              <div className="grid flex-1 gap-2">
                <label className="text-sm text-muted-foreground" htmlFor="api-key-name">
                  {t("keyName")}
                </label>
                <Input
                  id="api-key-name"
                  value={keyName}
                  onChange={(event) => setKeyName(event.target.value)}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                disabled={isPending || !keyName.trim()}
                onClick={handleCreateKey}
              >
                {t("createApiKey")}
              </Button>
            </div>
          ) : null}
          {createdKey ? (
            <p className="rounded-lg border border-border bg-background/40 p-3 font-mono text-xs text-foreground">
              {createdKey}
            </p>
          ) : null}
          {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
        </div>
      </SettingsCard>
    </div>
  );
}
