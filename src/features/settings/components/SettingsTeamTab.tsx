import { format } from "date-fns";
import type { TeamMemberRow } from "../types";
import { SettingsCard } from "./settings-card";

export function SettingsTeamTab({
  members,
  canManageMembers,
}: {
  members: TeamMemberRow[];
  canManageMembers: boolean;
}) {
  return (
    <SettingsCard
      title="Team Members"
      description="People with access to this workspace"
      footer={
        <p className="mr-auto text-xs text-muted-foreground">
          {canManageMembers
            ? "Member invites will be enabled in the next release."
            : "Only admins can manage team membership."}
        </p>
      }
    >
      <ul className="space-y-3">
        {members.map((member) => (
          <li
            key={member.id}
            className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background/40 px-4 py-3"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {member.name}
              </p>
              <p className="truncate text-xs text-muted-foreground">{member.email}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xs capitalize text-foreground">{member.role}</p>
              <p className="text-xs text-muted-foreground">
                Joined {format(member.createdAt, "MMM d, yyyy")}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </SettingsCard>
  );
}
