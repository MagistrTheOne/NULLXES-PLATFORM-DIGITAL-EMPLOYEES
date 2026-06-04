import Link from "next/link";
import { format } from "date-fns";
import { Loader2, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { EmployeeListItem } from "../types";
import { AvatarIdlePreview } from "./avatar-idle-preview";
import { EmployeeProviderBadge } from "./employee-provider-badge";
import { EmployeeStatusBadge } from "./employee-status-badge";

function provisioningLabel(status: EmployeeListItem["avatarProvisioningStatus"]): string {
  if (status === "provisioning") {
    return "Provisioning avatar…";
  }

  if (status === "pending") {
    return "Queued for provisioning";
  }

  if (status === "failed") {
    return "Avatar provisioning failed";
  }

  return "";
}

export function EmployeeCard({ employee }: { employee: EmployeeListItem }) {
  const createdLabel = format(employee.createdAt, "MMM d, yyyy");
  const isProvisioning =
    employee.avatarProvisioningStatus === "pending" ||
    employee.avatarProvisioningStatus === "provisioning";
  const showPreview =
    employee.avatarPreviewUrl &&
    employee.avatarProvisioningStatus === "ready";

  return (
    <Card className="flex h-full flex-col gap-0 overflow-hidden border-white/10 bg-[#111111] py-0 text-white ring-white/10">
      <div className="relative flex aspect-4/3 items-center justify-center border-b border-white/10 bg-white/3">
        {showPreview ? (
          <AvatarIdlePreview
            src={employee.avatarPreviewUrl!}
            alt={employee.name}
            sizes="(max-width: 768px) 100vw, 320px"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-white/40">
            {isProvisioning ? (
              <Loader2 className="size-8 animate-spin stroke-[1.25]" />
            ) : (
              <UserRound className="size-8 stroke-[1.25]" />
            )}
            <span className="px-4 text-center text-xs tracking-wide uppercase">
              {provisioningLabel(employee.avatarProvisioningStatus) ||
                "Avatar preview"}
            </span>
          </div>
        )}
      </div>
      <CardContent className="flex flex-1 flex-col gap-4 px-5 py-5">
        <div className="flex flex-col gap-2">
          <div className="min-w-0">
            <Link
              href={`/dashboard/employees/${employee.id}`}
              className="truncate text-base font-medium text-white hover:text-white/80"
            >
              {employee.name}
            </Link>
            <p className="truncate text-sm text-white/60">{employee.role}</p>
          </div>
          <EmployeeStatusBadge status={employee.status} />
        </div>
        <div className="mt-auto flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <EmployeeProviderBadge
              kind="Avatar"
              provider={employee.avatarProvider}
            />
            <EmployeeProviderBadge kind="Brain" provider={employee.brainProvider} />
            {employee.sessionVoiceProvider ? (
              <EmployeeProviderBadge
                kind="Voice"
                provider={employee.sessionVoiceProvider}
              />
            ) : null}
          </div>
          <div className="flex items-center justify-between gap-3">
            <Button
              type="button"
              disabled={!employee.canTalk}
              variant="outline"
              className="border-white/10 bg-transparent text-white hover:bg-white/5 disabled:opacity-40"
              asChild={employee.canTalk}
            >
              {employee.canTalk ? (
                <Link href={`/dashboard/employees/${employee.id}/talk`}>
                  Talk
                </Link>
              ) : (
                <span>Talk</span>
              )}
            </Button>
            <span className="text-xs text-white/50">{createdLabel}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
