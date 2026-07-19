"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AnamApiKeySlot } from "@/shared/config/anam-api-pool";
import type { AnamPoolStatus } from "../services/get-anam-pool-status";
import { AnamAdminRepointButton } from "./anam-admin-repoint-button";
import {
  PlatformMetricCell,
  PlatformMetricGrid,
} from "@/components/layout/platform-metric-grid";

function EmployeeRow({
  employee,
  showSlot = false,
  slotOptions,
}: {
  employee: AnamPoolStatus["failedEmployees"][number];
  showSlot?: boolean;
  slotOptions: Array<{ slot: AnamApiKeySlot; label: string }>;
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
        <AnamAdminRepointButton employee={employee} slotOptions={slotOptions} />
      ) : null}
    </div>
  );
}

function SlotStatusChips({
  slot,
}: {
  slot: AnamPoolStatus["slots"][number];
}) {
  return (
    <div className="flex flex-wrap gap-1.5 text-[10px]">
      <span
        className={
          slot.configured
            ? "rounded-full border border-white/15 px-2 py-0.5 text-white/70"
            : "rounded-full border border-white/10 px-2 py-0.5 text-white/35"
        }
      >
        {slot.configured ? "configured" : "missing"}
      </span>
      {slot.configured && slot.credentialHealthy === false ? (
        <span className="rounded-full border border-white/20 px-2 py-0.5 text-white/55">
          invalid key
        </span>
      ) : null}
      {slot.configured && slot.credentialHealthy === true ? (
        <span className="rounded-full border border-white/15 px-2 py-0.5 text-white/70">
          key ok
        </span>
      ) : null}
      {slot.atCapacity ? (
        <span className="rounded-full border border-white/20 px-2 py-0.5 text-white/80">
          at capacity
        </span>
      ) : null}
    </div>
  );
}

export function AnamAdminScreen({ status }: { status: AnamPoolStatus }) {
  const atCapacityCount = status.slots.filter(
    (slot) => slot.configured && slot.atCapacity,
  ).length;

  const slotOptions = useMemo(
    () =>
      status.slots
        .filter((slot) => slot.configured)
        .map((slot) => ({ slot: slot.slot, label: slot.label })),
    [status.slots],
  );

  const defaultFocus =
    status.slots.find((slot) => slot.configured)?.slot ??
    status.slots[0]?.slot ??
    "ANAM_API_KEY";

  const [focusSlot, setFocusSlot] = useState<AnamApiKeySlot>(defaultFocus);

  const focused = status.slots.find((slot) => slot.slot === focusSlot);

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

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {status.slots.map((slot) => {
          const selected = slot.slot === focusSlot;
          return (
            <button
              key={slot.slot}
              type="button"
              onClick={() => setFocusSlot(slot.slot)}
              className={
                selected
                  ? "rounded-xl border border-white/25 bg-white/5 p-3 text-left transition-colors"
                  : "rounded-xl border border-white/8 bg-[#111111] p-3 text-left transition-colors hover:bg-white/3"
              }
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white">{slot.label}</p>
                  <p className="mt-0.5 truncate font-mono text-[10px] text-white/40">
                    {slot.slot}
                  </p>
                </div>
                <p className="shrink-0 text-xs text-white/55">
                  {slot.personaCount}/{status.maxPersonasPerKey}
                </p>
              </div>
              <div className="mt-2">
                <SlotStatusChips slot={slot} />
              </div>
            </button>
          );
        })}
      </div>

      <section className="rounded-2xl border border-white/10 bg-[#111111] p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="grid gap-1.5">
            <label className="text-xs text-white/50" htmlFor="anam-focus-key">
              Focus key
            </label>
            <Select
              value={focusSlot}
              onValueChange={(value) => setFocusSlot(value as AnamApiKeySlot)}
            >
              <SelectTrigger
                id="anam-focus-key"
                className="min-w-[16rem] border-white/12 bg-transparent text-white"
              >
                <SelectValue placeholder="Select slot" />
              </SelectTrigger>
              <SelectContent>
                {status.slots.map((slot) => (
                  <SelectItem key={slot.slot} value={slot.slot}>
                    {slot.label} · {slot.slot}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {focused ? (
            <div className="text-right text-xs text-white/50">
              <p>
                {focused.personaCount} persona
                {focused.personaCount === 1 ? "" : "s"} · limit{" "}
                {status.maxPersonasPerKey}
              </p>
              <div className="mt-1 flex justify-end">
                <SlotStatusChips slot={focused} />
              </div>
            </div>
          ) : null}
        </div>

        {focused ? (
          focused.employees.length > 0 ? (
            <div className="mt-4 flex max-h-80 flex-col gap-2 overflow-y-auto">
              {focused.employees.map((employee) => (
                <EmployeeRow
                  key={employee.id}
                  employee={employee}
                  slotOptions={slotOptions}
                />
              ))}
            </div>
          ) : (
            <p className="mt-4 text-xs text-white/35">
              No employees on this key.
            </p>
          )
        ) : null}
      </section>

      {status.failedEmployees.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-white">
            Failed provisioning ({status.failedEmployees.length})
          </h2>
          <div className="flex flex-col gap-2">
            {status.failedEmployees.map((employee) => (
              <EmployeeRow
                key={employee.id}
                employee={employee}
                showSlot
                slotOptions={slotOptions}
              />
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
              <EmployeeRow
                key={employee.id}
                employee={employee}
                showSlot
                slotOptions={slotOptions}
              />
            ))}
          </div>
        </section>
      ) : null}

      <p className="text-xs leading-relaxed text-white/40">
        Slots reflect runtime env (e.g. Vercel project env). Redeploy / env
        change required to add keys. There is no live Vercel Management API
        sync — configured means{" "}
        <span className="font-mono text-white/50">process.env[ANAM_API_KEY*]</span>{" "}
        is present on this deployment.
      </p>
    </div>
  );
}
