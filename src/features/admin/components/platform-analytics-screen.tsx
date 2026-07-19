import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  PlatformMetricCell,
  PlatformMetricGrid,
} from "@/components/layout/platform-metric-grid";
import type { PlatformAnalyticsSnapshot } from "../services/get-platform-analytics-snapshot";

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(date);
}

export function PlatformAnalyticsScreen({
  snapshot,
}: {
  snapshot: PlatformAnalyticsSnapshot;
}) {
  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      <div>
        <h1 className="text-xl font-medium tracking-tight text-white sm:text-2xl">
          Platform Analytics
        </h1>
        <p className="mt-2 text-sm text-white/60">
          Users, agent ownership, and subscriptions across the platform.
        </p>
      </div>

      <PlatformMetricGrid>
        <PlatformMetricCell label="Users" value={snapshot.totalUsers} />
        <PlatformMetricCell
          label="Organizations"
          value={snapshot.totalOrganizations}
        />
        <PlatformMetricCell
          label="Digital Employees"
          value={snapshot.totalAgents}
        />
        <PlatformMetricCell
          label="Paid organizations"
          value={snapshot.paidOrganizations}
        />
      </PlatformMetricGrid>

      <section className="rounded-2xl border border-white/10 bg-[#111111] p-4">
        <h2 className="text-sm font-medium text-white">Plan mix</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {snapshot.planMix.map((row) => (
            <Badge
              key={row.planId}
              variant="outline"
              className="border-white/15 bg-white/3 px-2.5 py-1 text-xs text-white/80"
            >
              {row.planName}
              <span className="ml-1.5 tabular-nums text-white/50">
                {row.organizationCount}
              </span>
            </Badge>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#111111] p-4">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-sm font-medium text-white">Tenants</h2>
          {snapshot.tenantsTruncated ? (
            <p className="text-xs text-white/40">
              Showing first {snapshot.tenants.length} organizations
            </p>
          ) : null}
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-white/50">Organization</TableHead>
              <TableHead className="text-white/50">Owner</TableHead>
              <TableHead className="text-right text-white/50">Members</TableHead>
              <TableHead className="text-right text-white/50">Agents</TableHead>
              <TableHead className="text-white/50">Plan</TableHead>
              <TableHead className="text-white/50">Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {snapshot.tenants.length === 0 ? (
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableCell
                  colSpan={6}
                  className="py-8 text-center text-sm text-white/40"
                >
                  No organizations yet.
                </TableCell>
              </TableRow>
            ) : (
              snapshot.tenants.map((tenant) => (
                <TableRow
                  key={tenant.organizationId}
                  className="border-white/10 hover:bg-white/3"
                >
                  <TableCell className="font-medium text-white">
                    {tenant.organizationName}
                  </TableCell>
                  <TableCell className="text-white/70">
                    <div className="min-w-0">
                      <p className="truncate">
                        {tenant.ownerName ?? "—"}
                      </p>
                      {tenant.ownerEmail ? (
                        <p className="truncate text-xs text-white/40">
                          {tenant.ownerEmail}
                        </p>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-white/70">
                    {tenant.memberCount}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-white/70">
                    {tenant.agentCount}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="border-white/15 bg-transparent text-white/75"
                    >
                      {tenant.billingPlanName}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-white/55">
                    {formatDate(tenant.createdAt)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </section>
    </div>
  );
}
