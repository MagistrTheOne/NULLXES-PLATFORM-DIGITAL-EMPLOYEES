"use client";

import { formatOrganizationDate } from "@/shared/i18n/format-organization-date";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
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

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

export function SettingsTeamTab({
  members,
  pendingInvites,
  canManageMembers,
  currentUserId,
  actorRole,
  dateFormat,
  emailDeliveryConfigured,
}: {
  members: TeamMemberRow[];
  pendingInvites: TeamInviteRow[];
  canManageMembers: boolean;
  currentUserId: string;
  actorRole: MembershipRole;
  dateFormat: string;
  emailDeliveryConfigured: boolean;
}) {
  const t = useTranslations("settings.team");
  const locale = useLocale();
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
      setMessage(result.emailSent ? t("resentEmail") : t("resentNoEmail"));
      router.refresh();
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="space-y-1">
        <h2 className="text-lg font-medium tracking-tight text-foreground">
          {t("heading")}
        </h2>
        <p className="text-sm text-muted-foreground">{t("headingDesc")}</p>
      </div>

      {canManageMembers ? (
        <SettingsCard title={t("inviteMember")} description={t("inviteDescription")}>
          <SettingsTeamInviteForm
            emailDeliveryConfigured={emailDeliveryConfigured}
            onInvited={() => router.refresh()}
          />
        </SettingsCard>
      ) : null}

      {canManageMembers && pendingInvites.length > 0 ? (
        <SettingsCard
          title={t("pendingInvites")}
          description={t("pendingInvitesDesc")}
        >
          <ItemGroup className="gap-2">
            {pendingInvites.map((invite) => (
              <Item key={invite.id} variant="outline" size="sm">
                <ItemMedia>
                  <Avatar size="sm">
                    <AvatarFallback className="text-[10px]">
                      {invite.email.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>{invite.email}</ItemTitle>
                  <ItemDescription>
                    <span className="capitalize">{invite.role}</span>
                    {" · "}
                    {t("invitedBy", { name: invite.invitedByName })}
                    {" · "}
                    {t("expires", {
                      date: formatOrganizationDate(invite.expiresAt, {
                        dateFormat,
                        locale,
                      }),
                    })}
                  </ItemDescription>
                </ItemContent>
                <ItemActions>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isPending}
                    onClick={() => handleResendInvite(invite.id)}
                  >
                    {t("resend")}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isPending}
                    onClick={() => handleRevokeInvite(invite.id)}
                  >
                    {t("revoke")}
                  </Button>
                </ItemActions>
              </Item>
            ))}
          </ItemGroup>
        </SettingsCard>
      ) : null}

      <SettingsCard
        title={t("teamMembers")}
        description={t("teamMembersDesc")}
        footer={
          <p className="mr-auto text-xs text-muted-foreground">
            {canManageMembers ? t("footerManage") : t("footerView")}
          </p>
        }
      >
        <ItemGroup className="gap-2">
          {members.map((member) => {
            const isSelf = member.userId === currentUserId;
            const canEditMember = canManageMembers && !isSelf;

            return (
              <Item key={member.id} variant="outline" size="sm">
                <ItemMedia>
                  <Avatar size="sm">
                    <AvatarFallback className="text-[10px]">
                      {initials(member.name)}
                    </AvatarFallback>
                  </Avatar>
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>
                    {member.name}
                    {isSelf ? (
                      <span className="text-xs font-normal text-muted-foreground">
                        {t("you")}
                      </span>
                    ) : null}
                  </ItemTitle>
                  <ItemDescription>{member.email}</ItemDescription>
                </ItemContent>
                <ItemActions className="flex-wrap">
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
                    <span className="text-xs capitalize text-muted-foreground">
                      {member.role}
                    </span>
                  )}
                  <span className="hidden text-xs text-muted-foreground sm:inline">
                    {t("joined", {
                      date: formatOrganizationDate(member.createdAt, {
                        dateFormat,
                        locale,
                      }),
                    })}
                  </span>
                  {canEditMember ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={isPending}
                      onClick={() => handleRemoveMember(member.id)}
                    >
                      {t("remove")}
                    </Button>
                  ) : null}
                </ItemActions>
              </Item>
            );
          })}
        </ItemGroup>
      </SettingsCard>

      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </div>
  );
}
