import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { MissionDetail } from "../queries/get-mission-detail";
import type { MissionPendingApproval } from "../queries/get-pending-mission-approval";
import { MissionApprovalPanel } from "./mission-approval-panel";
import { MissionDetailActions } from "./mission-detail-actions";

const EDITABLE_STATUSES = new Set(["planned", "failed", "cancelled"]);

function statusLabel(status: MissionDetail["status"]): string {
  switch (status) {
    case "planned":
      return "Planned";
    case "working":
      return "Working";
    case "waiting_approval":
      return "Waiting approval";
    case "completed":
      return "Completed";
    case "failed":
      return "Failed";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
}

export function MissionDetailScreen({
  mission,
  pendingApproval,
  canManageOrganization,
  canOperateEmployees,
}: {
  mission: MissionDetail;
  pendingApproval: MissionPendingApproval | null;
  canManageOrganization: boolean;
  canOperateEmployees: boolean;
}) {
  const canEdit =
    canOperateEmployees && EDITABLE_STATUSES.has(mission.status);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Button
            asChild
            variant="ghost"
            className="mb-4 px-0 text-white/60 hover:bg-transparent hover:text-white"
          >
            <Link href="/dashboard/missions">Back to missions</Link>
          </Button>
          <h1 className="text-2xl font-medium tracking-tight text-white">
            {mission.title}
          </h1>
          <p className="mt-2 text-sm text-white/60">
            {mission.employeeName} · {mission.employeeRole}
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <MissionDetailActions missionId={mission.id} canEdit={canEdit} />
          <Badge
            variant="outline"
            className="border-white/10 bg-transparent text-white/80"
          >
            {statusLabel(mission.status)}
          </Badge>
          {mission.source === "scheduled" ? (
            <Badge
              variant="outline"
              className="border-white/10 bg-transparent text-white/70"
            >
              Scheduled
            </Badge>
          ) : null}
        </div>
      </div>

      {pendingApproval ? (
        <MissionApprovalPanel
          approval={pendingApproval}
          canManage={canManageOrganization}
        />
      ) : null}

      {mission.goal ? (
        <section className="rounded-2xl border border-white/8 bg-[#111111] p-5">
          <h2 className="text-sm font-medium text-white">Goal</h2>
          <p className="mt-3 text-sm leading-6 text-white/70">{mission.goal}</p>
        </section>
      ) : null}

      {mission.skills.length > 0 ? (
        <section className="rounded-2xl border border-white/8 bg-[#111111] p-5">
          <h2 className="text-sm font-medium text-white">Skills</h2>
          <p className="mt-3 text-sm leading-6 text-white/70">
            {mission.skills.join(" · ")}
          </p>
        </section>
      ) : null}

      <section className="rounded-2xl border border-white/8 bg-[#111111] p-5">
        <h2 className="text-sm font-medium text-white">Brief</h2>
        <p className="mt-3 text-sm leading-6 text-white/70">{mission.brief}</p>
      </section>

      {mission.plan ? (
        <section className="rounded-2xl border border-white/8 bg-[#111111] p-5">
          <h2 className="text-sm font-medium text-white">Plan</h2>
          <pre className="mt-3 whitespace-pre-wrap text-sm leading-6 text-white/70">
            {mission.plan}
          </pre>
        </section>
      ) : null}

      {mission.timeline.length > 0 ? (
        <section className="rounded-2xl border border-white/8 bg-[#111111] p-5">
          <h2 className="text-sm font-medium text-white">Timeline</h2>
          <ul className="mt-4 space-y-3">
            {mission.timeline.map((step) => (
              <li
                key={`${step.key}-${step.at}`}
                className="flex items-start justify-between gap-4 border-b border-white/6 pb-3 last:border-b-0 last:pb-0"
              >
                <span className="text-sm text-white/80">{step.label}</span>
                <span className="text-xs text-white/45">
                  {new Date(step.at).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {mission.evidence.length > 0 ? (
        <section className="rounded-2xl border border-white/8 bg-[#111111] p-5">
          <h2 className="text-sm font-medium text-white">Evidence</h2>
          <ul className="mt-4 space-y-4">
            {mission.evidence.map((item, index) => (
              <li key={`${item.source}-${index}`}>
                <p className="text-sm text-white/80">{item.source}</p>
                {item.url ? (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 block truncate text-xs text-white/60 hover:text-white hover:underline"
                  >
                    {item.url}
                  </a>
                ) : null}
                <p className="mt-2 text-sm leading-6 text-white/50">
                  {item.snippet}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {mission.leads.length > 0 ? (
        <section className="rounded-2xl border border-white/8 bg-[#111111] p-5">
          <h2 className="text-sm font-medium text-white">Proposal drafts</h2>
          <div className="mt-4 grid gap-4">
            {mission.leads.map((lead) => (
              <article
                key={`${lead.companyName}-${lead.domain ?? "lead"}`}
                className="rounded-xl border border-white/6 bg-black/20 p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-medium text-white">
                    {lead.companyName}
                  </h3>
                  {lead.domain ? (
                    <span className="text-xs text-white/45">{lead.domain}</span>
                  ) : null}
                  {lead.sentAt ? (
                    <Badge
                      variant="outline"
                      className="border-white/10 bg-transparent text-white/70"
                    >
                      Sent
                    </Badge>
                  ) : null}
                  {lead.sendError ? (
                    <Badge
                      variant="outline"
                      className="border-white/10 bg-transparent text-white/70"
                    >
                      Send failed
                    </Badge>
                  ) : null}
                </div>
                <p className="mt-3 text-sm text-white/70">{lead.whyFit}</p>
                {lead.budgetSignal ? (
                  <p className="mt-2 text-xs text-white/50">
                    Budget signal: {lead.budgetSignal}
                  </p>
                ) : null}
                {lead.contactName ? (
                  <p className="mt-1 text-xs text-white/50">
                    Contact: {lead.contactName}
                    {lead.contactHypothesis ? ` · ${lead.contactHypothesis}` : ""}
                  </p>
                ) : lead.contactHypothesis ? (
                  <p className="mt-1 text-xs text-white/50">
                    Contact: {lead.contactHypothesis}
                  </p>
                ) : null}
                {lead.contactEmail ? (
                  <p className="mt-1 text-xs text-white/50">
                    Email: {lead.contactEmail}
                  </p>
                ) : null}
                {lead.contactSourceUrl ? (
                  <p className="mt-1 text-xs text-white/50">
                    Source:{" "}
                    <a
                      href={lead.contactSourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="underline underline-offset-2"
                    >
                      {lead.contactSourceUrl}
                    </a>
                  </p>
                ) : null}
                {lead.sendError ? (
                  <p className="mt-2 text-xs text-white/60">{lead.sendError}</p>
                ) : null}
                <div className="mt-4 rounded-lg border border-white/6 bg-[#0a0a0a] p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/40">
                    Proposal draft
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-white/75">
                    {lead.proposalDraft}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {mission.handoffs.length > 0 ? (
        <section className="rounded-2xl border border-white/8 bg-[#111111] p-5">
          <h2 className="text-sm font-medium text-white">Workforce handoff</h2>
          <ul className="mt-4 space-y-4">
            {mission.handoffs.map((handoff) => (
              <li
                key={handoff.handoffId}
                className="rounded-xl border border-white/6 bg-black/20 p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-white">
                    {handoff.toEmployeeName}
                  </p>
                  <span className="text-xs text-white/45">{handoff.role}</span>
                  <Badge
                    variant="outline"
                    className="border-white/10 bg-transparent text-white/70"
                  >
                    {handoff.status}
                  </Badge>
                </div>
                <p className="mt-2 text-xs uppercase tracking-[0.2em] text-white/40">
                  {handoff.stage.replaceAll("_", " ")}
                </p>
                {handoff.summary ? (
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-white/70">
                    {handoff.summary}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {mission.errorMessage ? (
        <section className="rounded-2xl border border-white/8 bg-[#111111] p-5">
          <h2 className="text-sm font-medium text-white">Error</h2>
          <p className="mt-3 text-sm text-white/70">{mission.errorMessage}</p>
        </section>
      ) : null}
    </div>
  );
}
