"use client";

import { useState, useTransition } from "react";
import type { OrganizationProvider } from "@/entities/organization-provider-credential";
import type { ProviderKeyStatus } from "@/features/provider-credentials/types/provider-key-status";
import {
  removeProviderCredentialAction,
  setProviderCredentialAction,
} from "@/features/provider-credentials/actions/manage-provider-credential";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SettingsCard } from "./settings-card";

const PROVIDER_LABELS: Record<OrganizationProvider, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  google: "Google",
  nullxes: "NULLXES",
};

function sourceLabel(status: ProviderKeyStatus): string {
  if (status.source === "organization") {
    return `Your key · ••${status.last4 ?? ""}`;
  }
  if (status.source === "platform") {
    return "Using platform default";
  }
  return "Not configured";
}

function ProviderRow({
  status,
  canManage,
}: {
  status: ProviderKeyStatus;
  canManage: boolean;
}) {
  const [value, setValue] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    setMessage(null);
    startTransition(async () => {
      const result = await setProviderCredentialAction({
        provider: status.provider,
        apiKey: value,
      });
      if (result.ok) {
        setValue("");
        setMessage("Saved");
      } else {
        setMessage(result.message);
      }
    });
  }

  function handleRemove() {
    setMessage(null);
    startTransition(async () => {
      const result = await removeProviderCredentialAction({
        provider: status.provider,
      });
      setMessage(result.ok ? "Reverted to platform default" : result.message);
    });
  }

  return (
    <div className="rounded-xl border border-border bg-card/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-foreground">
          {PROVIDER_LABELS[status.provider]}
        </p>
        <span className="text-xs text-muted-foreground">
          {sourceLabel(status)}
        </span>
      </div>

      {canManage ? (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            type="password"
            autoComplete="off"
            placeholder={`Paste ${PROVIDER_LABELS[status.provider]} API key`}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            disabled={isPending}
            className="flex-1"
          />
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={handleSave}
              disabled={isPending || value.trim().length < 12}
            >
              Save
            </Button>
            {status.source === "organization" ? (
              <Button
                type="button"
                variant="outline"
                onClick={handleRemove}
                disabled={isPending}
              >
                Remove
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      {message ? (
        <p className="mt-2 text-xs text-muted-foreground" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}

export function ProviderKeysCard({
  statuses,
  canManageOrganization,
}: {
  statuses: ProviderKeyStatus[];
  canManageOrganization: boolean;
}) {
  return (
    <SettingsCard
      title="Provider API keys"
      description="Use your own provider keys instead of the platform defaults. Keys are encrypted at rest and never shown again after saving."
    >
      <div className="grid gap-3">
        {statuses.map((status) => (
          <ProviderRow
            key={status.provider}
            status={status}
            canManage={canManageOrganization}
          />
        ))}
        <p className="text-xs text-muted-foreground">
        NULLXES PROVIDER KEY PLACE HERE.
        </p>
      </div>
    </SettingsCard>
  );
}
