"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
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
  onInvited,
}: {
  onInvited?: () => void;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<MembershipRole>("viewer");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleInvite(): void {
    startTransition(async () => {
      const result = await inviteTeamMemberAction({ email, role });
      if (!result.ok) {
        setMessage(result.message);
        return;
      }
      setEmail("");
      setMessage(
        "Invite created. Email sends when Resend is configured; the invite is always stored.",
      );
      onInvited?.();
      router.refresh();
    });
  }

  return (
    <div className="grid gap-3 sm:grid-cols-[1fr_160px_auto] sm:items-end">
      <div className="grid gap-2">
        <label className="text-sm text-muted-foreground" htmlFor="invite-email">
          Email
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
          Role
        </label>
        <Select value={role} onValueChange={(value) => setRole(value as MembershipRole)}>
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
      <Button type="button" disabled={isPending || !email.trim()} onClick={handleInvite}>
        Invite
      </Button>
      {message ? <p className="text-sm text-muted-foreground sm:col-span-3">{message}</p> : null}
    </div>
  );
}
