"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Filter, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { ConversationEmployee } from "./conversations-screen";

const ALL_DEPARTMENTS = [
  "reception",
  "sales",
  "support",
  "hr",
  "analytics",
  "executive",
] as const;

const DEPARTMENT_LABELS: Record<string, string> = {
  reception: "Reception",
  sales: "Sales",
  support: "Support",
  hr: "HR",
  analytics: "Analytics",
  executive: "Executive",
};

export type ConversationsFilterState = {
  departments: string[];
  employeeIds: string[];
  onlyReady: boolean;
};

export function ConversationsToolbar({
  query,
  onQueryChange,
  onNewConversation,
  filter = { departments: [], employeeIds: [], onlyReady: false },
  onFilterChange,
  filterCount,
  allEmployees = [],
}: {
  query: string;
  onQueryChange: (value: string) => void;
  onNewConversation: () => void;
  filter?: ConversationsFilterState;
  onFilterChange?: (value: ConversationsFilterState) => void;
  filterCount?: string;
  allEmployees?: ConversationEmployee[];
}) {
  const t = useTranslations("conversations");

  return (
    <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
      <InputGroup className="h-10 w-full border-white/8 bg-white/2 shadow-none sm:w-[280px] has-[[data-slot=input-group-control]:focus-visible]:border-white/16 has-[[data-slot=input-group-control]:focus-visible]:ring-0">
        <InputGroupAddon align="inline-start" className="text-white/35">
          <Search className="size-4" />
        </InputGroupAddon>
        <InputGroupInput
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={t("searchPlaceholder")}
          className="text-sm text-white placeholder:text-white/35"
        />
        <InputGroupAddon align="inline-end" className="hidden sm:flex">
          <InputGroupText>
            <kbd className="rounded-md border border-white/8 bg-white/3 px-1.5 py-0.5 text-[10px] font-medium text-white/35">
              ⌘K
            </kbd>
          </InputGroupText>
        </InputGroupAddon>
      </InputGroup>

      <div className="flex items-center gap-2">
        <Popover>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className={cn(
                    "size-10 shrink-0 border-white/8 bg-white/2 text-white/60 hover:bg-white/4 hover:text-white relative",
                    (filter.departments.length > 0 ||
                      filter.employeeIds.length > 0 ||
                      filter.onlyReady) &&
                      "border-white/20 bg-white/5 text-white ring-1 ring-inset ring-white/10",
                  )}
                >
                  <Filter className="size-4" />
                  {filterCount ? (
                    <span className="absolute -right-1 -top-1 rounded-full bg-white/10 px-1 text-[9px] tabular-nums text-white/70">
                      {filterCount}
                    </span>
                  ) : null}
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent>Filter by department or employee</TooltipContent>
          </Tooltip>

          <PopoverContent className="w-80 border-white/8 bg-[#111111] p-0" align="end">
            <FilterPopoverContent
              filter={filter}
              onFilterChange={onFilterChange}
              allEmployees={allEmployees}
            />
          </PopoverContent>
        </Popover>

        <Button
          type="button"
          className="h-10 shrink-0 gap-2 px-4 text-xs font-medium"
          onClick={onNewConversation}
        >
          <Plus className="size-4" />
          {t("newConversation")}
        </Button>
      </div>
    </div>
  );
}

function FilterPopoverContent({
  filter,
  onFilterChange,
  allEmployees,
}: {
  filter: ConversationsFilterState;
  onFilterChange?: (next: ConversationsFilterState) => void;
  allEmployees: ConversationEmployee[];
}) {
  const [employeeSearch, setEmployeeSearch] = useState("");

  const update = (partial: Partial<ConversationsFilterState>) => {
    const next = { ...filter, ...partial };
    onFilterChange?.(next);
  };

  const toggleDepartment = (dept: string) => {
    const current = filter.departments;
    const nextDepts = current.includes(dept)
      ? current.filter((d) => d !== dept)
      : [...current, dept];
    update({ departments: nextDepts });
  };

  const toggleEmployee = (id: string) => {
    const current = filter.employeeIds;
    const nextIds = current.includes(id)
      ? current.filter((i) => i !== id)
      : [...current, id];
    update({ employeeIds: nextIds });
  };

  const clearAll = () => {
    onFilterChange?.({ departments: [], employeeIds: [], onlyReady: false });
  };

  const filteredEmployeesForSelect = useMemo(() => {
    const q = employeeSearch.trim().toLowerCase();
    if (!q) return allEmployees;
    return allEmployees.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        (e.role || "").toLowerCase().includes(q)
    );
  }, [employeeSearch, allEmployees]);

  const hasActiveFilters =
    filter.departments.length > 0 ||
    filter.employeeIds.length > 0 ||
    filter.onlyReady;

  return (
    <div className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-medium text-white">Filter conversations</div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-white/60 hover:text-white"
            onClick={clearAll}
          >
            <X className="mr-1 size-3" />
            Clear
          </Button>
        )}
      </div>

      {/* Readiness */}
      <div className="mb-3">
        <div className="mb-1.5 text-[10px] uppercase tracking-[0.12em] text-white/40">
          Readiness
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-white/90">
          <Checkbox
            checked={filter.onlyReady}
            onCheckedChange={(checked) =>
              update({ onlyReady: Boolean(checked) })
            }
          />
          Only ready for conversations
        </label>
      </div>

      {/* Departments */}
      <div className="mb-3">
        <div className="mb-1.5 text-[10px] uppercase tracking-[0.12em] text-white/40">
          Department
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {ALL_DEPARTMENTS.map((dept) => {
            const checked = filter.departments.includes(dept);
            return (
              <label
                key={dept}
                className="flex cursor-pointer items-center gap-2 rounded-md border border-white/8 bg-white/2 px-2 py-1.5 text-sm hover:bg-white/5"
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={() => toggleDepartment(dept)}
                />
                <span className="text-white/85">{DEPARTMENT_LABELS[dept] ?? dept}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Specific employees */}
      <div>
        <div className="mb-1.5 flex items-center justify-between text-[10px] uppercase tracking-[0.12em] text-white/40">
          <span>Specific employees</span>
          {filter.employeeIds.length > 0 && (
            <span className="normal-case text-white/50">
              {filter.employeeIds.length} selected
            </span>
          )}
        </div>

        <InputGroup className="mb-2 h-8 border-white/8 bg-white/2">
          <InputGroupAddon align="inline-start" className="text-white/35">
            <Search className="size-3.5" />
          </InputGroupAddon>
          <InputGroupInput
            value={employeeSearch}
            onChange={(e) => setEmployeeSearch(e.target.value)}
            placeholder="Search employees..."
            className="text-xs"
          />
        </InputGroup>

        <ScrollArea className="max-h-48 pr-1">
          <div className="flex flex-col gap-1">
            {filteredEmployeesForSelect.length === 0 && (
              <div className="px-2 py-2 text-xs text-white/40">No matches</div>
            )}
            {filteredEmployeesForSelect.map((emp) => {
              const checked = filter.employeeIds.includes(emp.id);
              return (
                <label
                  key={emp.id}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-white/5"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggleEmployee(emp.id)}
                  />
                  <span className="truncate text-white/85">{emp.name}</span>
                  {emp.role && (
                    <span className="ml-auto truncate text-[10px] text-white/35">
                      {emp.role}
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {hasActiveFilters && (
        <div className="mt-3 border-t border-white/8 pt-2 text-[10px] text-white/40">
          Active filters applied to the employee list
        </div>
      )}
    </div>
  );
}
