"use client";

import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { removeTeamMemberAction } from "@/features/team/actions/remove-team-member";
import { resendTeamInviteAction } from "@/features/team/actions/resend-team-invite";
import { revokeTeamInviteAction } from "@/features/team/actions/revoke-team-invite";
import { updateTeamMemberRoleAction } from "@/features/team/actions/update-team-member-role";
import type { MembershipRole } from "@/features/workspace/types";
import type { TeamInviteRow, TeamMemberRow } from "../types";
import { SettingsTeamInviteForm } from "./SettingsTeamInviteForm";
import { SettingsCard } from "./settings-card";

const ASSIGNABLE_ROLES: MembershipRole[] = ["admin", "operator", "viewer"];

function roleOptions(actorRole: MembershipRole): MembershipRole[] {
  return actorRole === "owner" ? ["owner", ...ASSIGNABLE_ROLES] : ASSIGNABLE_ROLES;
}

export function SettingsTeamTab({
  members,
  pendingInvites,
  canManageMembers,
  currentUserId,
  actorRole,
}: {
  members: TeamMemberRow[];
  pendingInvites: TeamInviteRow[];
  canManageMembers: boolean;
  currentUserId: string;
  actorRole: MembershipRole;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function refreshAfterAction(resultMessage: string | null): void {
    if (resultMessage) {
      setMessage(resultMessage);
    }
    router.refresh();
  }

  function handleRoleChange(membershipId: string, role: MembershipRole): void {
    startTransition(async () => {
      const result = await updateTeamMemberRoleAction({ membershipId, role });
      refreshAfterAction(result.ok ? null : result.message);
    });
  }

  function handleRemoveMember(membershipId: string): void {
    startTransition(async () => {
      const result = await removeTeamMemberAction(membershipId);
      refreshAfterAction(result.ok ? null : result.message);
    });
  }

  function handleRevokeInvite(inviteId: string): void {
    startTransition(async () => {
      const result = await revokeTeamInviteAction(inviteId);
      refreshAfterAction(result.ok ? null : result.message);
    });
  }

  function handleResendInvite(inviteId: string): void {
    startTransition(async () => {
      const result = await resendTeamInviteAction(inviteId);
      if (!result.ok) {
        setMessage(result.message);
        return;
      }
      setMessage(
        result.emailSent
          ? "Invite resent by email."
          : "Invite renewed. Configure Resend to send email delivery.",
      );
      router.refresh();
    });
  }

  return (
    <div className="grid gap-6">
      {canManageMembers ? (
        <SettingsCard title="Invite Member" description="Send a workspace invite by email">
          <SettingsTeamInviteForm onInvited={() => router.refresh()} />
        </SettingsCard>
      ) : null}

      {canManageMembers && pendingInvites.length > 0 ? (
        <SettingsCard
          title="Pending Invites"
          description="Outstanding invitations awaiting acceptance"
        >
          <ul className="space-y-3">
            {pendingInvites.map((invite) => (
              <li
                key={invite.id}
                className="flex flex-col gap-3 rounded-xl border border-border bg-background/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {invite.email}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <span className="capitalize">{invite.role}</span>
                    {" · "}
                    Invited by {invite.invitedByName}
                    {" · "}
                    Expires {format(invite.expiresAt, "MMM d, yyyy")}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isPending}
                    onClick={() => handleResendInvite(invite.id)}
                  >
                    Resend
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isPending}
                    onClick={() => handleRevokeInvite(invite.id)}
                  >
                    Revoke
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </SettingsCard>
      ) : null}

      <SettingsCard
        title="Team Members"
        description="People with access to this workspace"
        footer={
          <p className="mr-auto text-xs text-muted-foreground">
            {canManageMembers
              ? "Invites expire after 7 days. Members can accept via email or OAuth."
              : "Only admins can manage team membership."}
          </p>
        }
      >
        <ul className="space-y-3">
          {members.map((member) => {
            const isSelf = member.userId === currentUserId;
            const canEditMember = canManageMembers && !isSelf;

            return (
              <li
                key={member.id}
                className="flex flex-col gap-3 rounded-xl border border-border bg-background/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {member.name}
                    {isSelf ? (
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        (you)
                      </span>
                    ) : null}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{member.email}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {canEditMember ? (
                    <Select
                      value={member.role}
                      onValueChange={(value) =>
                        handleRoleChange(member.id, value as MembershipRole)
                      }
                      disabled={isPending}
                    >
                      <SelectTrigger className="w-[130px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {roleOptions(actorRole).map((role) => (
                          <SelectItem key={role} value={role} className="capitalize">
                            {role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-xs capitalize text-foreground">{member.role}</p>
                  )}
                  <p className="hidden text-xs text-muted-foreground sm:block">
                    Joined {format(member.createdAt, "MMM d, yyyy")}
                  </p>
                  {canEditMember ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={isPending}
                      onClick={() => handleRemoveMember(member.id)}
                    >
                      Remove
                    </Button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      </SettingsCard>

      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </div>
  );
}
