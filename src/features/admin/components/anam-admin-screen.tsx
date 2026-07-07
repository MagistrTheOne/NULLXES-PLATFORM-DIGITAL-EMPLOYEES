import Link from "next/link";
import type { AnamPoolStatus } from "../services/get-anam-pool-status";
import { AnamAdminRepointButton } from "./anam-admin-repoint-button";
import {
  PlatformMetricCell,
  PlatformMetricGrid,
} from "@/components/layout/platform-metric-grid";

function EmployeeRow({
  employee,
  showSlot = false,
}: {
  employee: AnamPoolStatus["failedEmployees"][number];
  showSlot?: boolean;
}) {
  return (
    <div className="rounded-lg border border-white/8 bg-white/2 px-3 py-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          href={`/dashboard/employees/${employee.id}`}
          className="text-sm font-medium text-white hover:text-white/80"
        >
          {employee.name}
        </Link>
        <div className="flex flex-wrap gap-2 text-xs text-white/45">
          <span>{employee.status}</span>
          <span>·</span>
          <span>{employee.provisioningStatus}</span>
          {showSlot ? (
            <>
              <span>·</span>
              <span className="max-w-[140px] truncate sm:max-w-none">
                {employee.slot}
              </span>
            </>
          ) : null}
        </div>
      </div>
      {employee.failureReason ? (
        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-white/55 sm:line-clamp-none">
          {employee.failureReason}
        </p>
      ) : null}
      {employee.provisioningStatus === "failed" ? (
        <AnamAdminRepointButton employee={employee} />
      ) : null}
    </div>
  );
}

export function AnamAdminScreen({ status }: { status: AnamPoolStatus }) {
  const atCapacityCount = status.slots.filter(
    (slot) => slot.configured && slot.atCapacity,
  ).length;

  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      <div>
        <h1 className="text-xl font-medium tracking-tight text-white sm:text-2xl">
          Anam Key Pool
        </h1>
        <p className="mt-2 text-sm text-white/60">
          Runtime view of configured Anam API keys and persona usage across the
          platform.
        </p>
      </div>

      <PlatformMetricGrid>
        <PlatformMetricCell
          label="Configured keys"
          value={`${status.configuredSlotCount} / ${status.totalSlots}`}
        />
        <PlatformMetricCell label="Anam employees" value={status.totalEmployees} />
        <PlatformMetricCell
          label="Max personas / key"
          value={status.maxPersonasPerKey}
        />
        <PlatformMetricCell label="Slots at capacity" value={atCapacityCount} />
      </PlatformMetricGrid>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-2 min-[1800px]:grid-cols-3">
        {status.slots.map((slot) => (
          <div
            key={slot.slot}
            className="rounded-2xl border border-white/10 bg-[#111111] p-3 sm:p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-white">{slot.label}</p>
                <p className="mt-0.5 truncate font-mono text-xs text-white/45">
                  {slot.slot}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <span
                  className={
                    slot.configured
                      ? "rounded-full border border-white/15 px-2 py-0.5 text-white/70"
                      : "rounded-full border border-white/10 px-2 py-0.5 text-white/35"
                  }
                >
                  {slot.configured ? "configured" : "missing on server"}
                </span>
                {slot.configured && slot.credentialHealthy === false ? (
                  <span className="rounded-full border border-red-400/30 px-2 py-0.5 text-red-200/90">
                    invalid key
                  </span>
                ) : null}
                {slot.configured && slot.credentialHealthy === true ? (
                  <span className="rounded-full border border-emerald-400/20 px-2 py-0.5 text-emerald-200/80">
                    key ok
                  </span>
                ) : null}
                {slot.atCapacity ? (
                  <span className="rounded-full border border-white/20 px-2 py-0.5 text-white/80">
                    at capacity
                  </span>
                ) : null}
              </div>
            </div>

            <p className="mt-3 text-sm text-white/55">
              {slot.personaCount} persona
              {slot.personaCount === 1 ? "" : "s"} · limit{" "}
              {status.maxPersonasPerKey}
            </p>

            {slot.employees.length > 0 ? (
              <div className="mt-3 flex max-h-48 flex-col gap-2 overflow-y-auto sm:max-h-none">
                {slot.employees.map((employee) => (
                  <EmployeeRow key={employee.id} employee={employee} />
                ))}
              </div>
            ) : (
              <p className="mt-3 text-xs text-white/35">No employees on this key.</p>
            )}
          </div>
        ))}
      </div>

      {status.failedEmployees.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-white">
            Failed provisioning ({status.failedEmployees.length})
          </h2>
          <div className="flex flex-col gap-2">
            {status.failedEmployees.map((employee) => (
              <EmployeeRow key={employee.id} employee={employee} showSlot />
            ))}
          </div>
        </section>
      ) : null}

      {status.unassignedEmployees.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-white">
            Personas without pinned slot ({status.unassignedEmployees.length})
          </h2>
          <p className="text-xs text-white/45">
            These employees have a persona but no stored anamApiKeySlot — they
            default to the first configured key at runtime.
          </p>
          <div className="flex flex-col gap-2">
            {status.unassignedEmployees.map((employee) => (
              <EmployeeRow key={employee.id} employee={employee} showSlot />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
