"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MembershipRole } from "@/features/workspace/types";
import { inviteTeamMemberAction } from "@/features/team/actions/invite-team-member";

export function SettingsTeamInviteForm({
  emailDeliveryConfigured,
  onInvited,
}: {
  emailDeliveryConfigured: boolean;
  onInvited?: () => void;
}) {
  const t = useTranslations("settings.team");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<MembershipRole>("viewer");
  const [message, setMessage] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleInvite(): void {
    startTransition(async () => {
      const result = await inviteTeamMemberAction({ email, role });
      if (!result.ok) {
        setMessage(result.message);
        return;
      }
      setEmail("");
      setInviteUrl(result.inviteUrl);
      setCopied(false);
      setMessage(
        result.emailSent ? t("inviteCreated") : t("inviteCreatedNoEmail"),
      );
      onInvited?.();
      router.refresh();
    });
  }

  async function copyInviteUrl(): Promise<void> {
    if (!inviteUrl) {
      return;
    }
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="grid gap-3">
      {!emailDeliveryConfigured ? (
        <p className="rounded-xl border border-border bg-background/40 px-4 py-3 text-sm text-muted-foreground">
          {t("emailNotConfigured")}{" "}
          <Link href="/settings?tab=notifications" className="text-foreground underline">
            {t("emailNotConfiguredLink")}
          </Link>
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-[1fr_160px_auto] sm:items-end">
        <div className="grid gap-2">
          <label className="text-sm text-muted-foreground" htmlFor="invite-email">
            {t("inviteEmail")}
          </label>
          <Input
            id="invite-email"
            type="email"
            value={email}
            placeholder="colleague@company.com"
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <label className="text-sm text-muted-foreground" htmlFor="invite-role">
            {t("inviteRole")}
          </label>
          <Select
            value={role}
            onValueChange={(value) => setRole(value as MembershipRole)}
          >
            <SelectTrigger id="invite-role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="operator">Operator</SelectItem>
              <SelectItem value="viewer">Viewer</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          type="button"
          disabled={isPending || !email.trim()}
          onClick={handleInvite}
        >
          {t("invite")}
        </Button>
      </div>

      {inviteUrl ? (
        <div className="rounded-xl border border-border bg-background/40 p-4 sm:col-span-3">
          <p className="text-sm text-muted-foreground">{t("inviteLinkLabel")}</p>
          <p className="mt-2 break-all font-mono text-xs text-foreground">{inviteUrl}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            disabled={isPending}
            onClick={() => startTransition(() => void copyInviteUrl())}
          >
            {copied ? t("inviteLinkCopied") : t("inviteLinkCopy")}
          </Button>
        </div>
      ) : null}

      {message ? (
        <p className="text-sm text-muted-foreground sm:col-span-3">{message}</p>
      ) : null}
    </div>
  );
}
