"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Check, Loader2, TriangleAlert, Wrench } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { assignEmployeeDepartmentAction } from "../actions/assign-employee-department";
import { HQ_DEPARTMENTS, type HqDepartment, type HqEmployee } from "../types";

function DesignRow({
  employee,
  isFirst,
}: {
  employee: HqEmployee;
  isFirst: boolean;
}) {
  const tDepartments = useTranslations("hq.departments");
  const [department, setDepartment] = useState<HqDepartment>(
    employee.department,
  );
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<"idle" | "saved" | "error">("idle");

  const onChange = (value: string) => {
    const next = value as HqDepartment;
    setDepartment(next);
    setState("idle");
    startTransition(async () => {
      const result = await assignEmployeeDepartmentAction(employee.id, next);
      setState(result.ok ? "saved" : "error");
    });
  };

  return (
    <div
      className={
        isFirst
          ? "flex items-center justify-between gap-4 px-4 py-3"
          : "flex items-center justify-between gap-4 border-t border-border px-4 py-3"
      }
    >
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-sm text-foreground">{employee.name}</span>
        <span className="truncate text-xs text-muted-foreground">
          {employee.role}
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="flex w-4 justify-center">
          {pending ? (
            <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
          ) : state === "saved" ? (
            <Check className="size-3.5 text-[#34d399]" />
          ) : state === "error" ? (
            <TriangleAlert className="size-3.5 text-[#f87171]" />
          ) : null}
        </span>
        <Select value={department} onValueChange={onChange} disabled={pending}>
          <SelectTrigger size="sm" className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {HQ_DEPARTMENTS.map((value) => (
              <SelectItem key={value} value={value}>
                {tDepartments(value)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export function HqDesignEditor({ employees }: { employees: HqEmployee[] }) {
  const t = useTranslations("hq.design");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4">
        <Wrench className="mt-0.5 size-4 shrink-0 stroke-[1.5] text-muted-foreground" />
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-medium text-foreground">{t("title")}</h3>
          <p className="text-xs text-muted-foreground">{t("description")}</p>
        </div>
      </div>
      {employees.length === 0 ? (
        <p className="rounded-2xl border border-border px-4 py-8 text-center text-sm text-muted-foreground">
          {t("empty")}
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border">
          {employees.map((employee, index) => (
            <DesignRow
              key={employee.id}
              employee={employee}
              isFirst={index === 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}
