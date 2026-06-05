"use client";

import { useState, useTransition } from "react";
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
      setMessage("Copy this key now. It will not be shown again.");
    });
  }

  function handleEnable2fa(): void {
    startTransition(async () => {
      const password = window.prompt("Confirm your password to enable 2FA:");
      if (!password) {
        return;
      }
      const result = await authClient.twoFactor.enable({ password });
      if (result.error) {
        setMessage(result.error.message ?? "Failed to enable 2FA.");
        return;
      }
      setMessage("Scan the TOTP URI in your authenticator app to finish setup.");
    });
  }

  return (
    <div className="grid gap-6">
      <SettingsCard title="Authentication" description="Account and session security">
        <div className="grid gap-3">
          <StatusRow
            label="Two-Factor Authentication"
            value={security.twoFactorEnabled ? "Enabled" : "Not enabled"}
          />
          <StatusRow
            label="Active Sessions"
            value={`${security.activeAuthSessions} device(s)`}
          />
          <StatusRow label="Session Timeout" value="30 minutes" />
          {!security.twoFactorEnabled ? (
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={handleEnable2fa}
            >
              Enable 2FA (TOTP)
            </Button>
          ) : null}
        </div>
      </SettingsCard>
      <SettingsCard title="API Access">
        <div className="grid gap-3">
          <StatusRow
            label="API Keys"
            value={security.apiKeysConfigured ? "Configured" : "Not configured"}
          />
          <StatusRow label="IP Allowlist" value="Disabled" />
          {canManageOrganization ? (
            <div className="flex flex-wrap items-end gap-3">
              <div className="grid flex-1 gap-2">
                <label className="text-sm text-muted-foreground" htmlFor="api-key-name">
                  Key name
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
                Create API Key
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
