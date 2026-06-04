"use client";

import { Plus, Search } from "lucide-react";
import type { EmployeeStatus } from "@/entities/digital-employee";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUS_FILTER_OPTIONS: Array<{ value: "all" | EmployeeStatus; label: string }> =
  [
    { value: "all", label: "All statuses" },
    { value: "draft", label: "Draft" },
    { value: "active", label: "Active" },
    { value: "paused", label: "Paused" },
    { value: "archived", label: "Archived" },
  ];

export function EmployeeToolbar({
  searchQuery,
  statusFilter,
  onSearchQueryChange,
  onStatusFilterChange,
}: {
  searchQuery: string;
  statusFilter: "all" | EmployeeStatus;
  onSearchQueryChange: (value: string) => void;
  onStatusFilterChange: (value: "all" | EmployeeStatus) => void;
}) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-1 flex-col gap-3 sm:flex-row">
        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-white/40" />
          <Input
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            placeholder="Search employees"
            className="border-white/10 bg-[#111111] pl-9 text-white placeholder:text-white/40"
            aria-label="Search employees"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) =>
            onStatusFilterChange(value as "all" | EmployeeStatus)
          }
        >
          <SelectTrigger
            className="w-full border-white/10 bg-[#111111] text-white sm:w-44"
            aria-label="Filter by status"
          >
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="border-white/10 bg-[#111111] text-white">
            {STATUS_FILTER_OPTIONS.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                className="text-white focus:bg-white/10 focus:text-white"
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button
        type="button"
        className="shrink-0 bg-white text-black hover:bg-white/90"
      >
        <Plus />
        Create Employee
      </Button>
    </div>
  );
}
