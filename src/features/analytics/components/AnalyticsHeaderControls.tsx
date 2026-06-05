"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { CalendarIcon, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  formatAnalyticsRangeLabel,
  formatUtcDate,
  startOfUtcDay,
} from "../lib/date-range";
import type { AnalyticsDateRange, DashboardAnalytics } from "../types";

function toDateRange(range: AnalyticsDateRange): DateRange {
  return { from: range.from, to: range.to };
}

function exportAnalyticsReport(data: DashboardAnalytics): void {
  const payload = JSON.stringify(data, null, 2);
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `nullxes-analytics-${formatUtcDate(data.range.from)}-${formatUtcDate(data.range.to)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function AnalyticsHeaderControls({
  range,
  data,
}: {
  range: AnalyticsDateRange;
  data: DashboardAnalytics;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>(
    toDateRange(range),
  );

  function applyRange(nextRange: DateRange | undefined): void {
    if (!nextRange?.from || !nextRange.to) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set("from", formatUtcDate(startOfUtcDay(nextRange.from)));
    params.set("to", formatUtcDate(startOfUtcDay(nextRange.to)));
    setSelectedRange(nextRange);
    setOpen(false);
    router.push(`/dashboard/analytics?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="min-w-[220px] justify-start">
            <CalendarIcon className="size-4" />
            {formatAnalyticsRangeLabel(range)}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-auto p-0">
          <Calendar
            mode="range"
            selected={selectedRange}
            onSelect={setSelectedRange}
            numberOfMonths={2}
            disabled={{ after: new Date() }}
          />
          <div className="flex justify-end border-t border-border p-3">
            <Button
              type="button"
              size="sm"
              onClick={() => applyRange(selectedRange)}
              disabled={!selectedRange?.from || !selectedRange?.to}
            >
              Apply range
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      <Button
        type="button"
        variant="outline"
        onClick={() => exportAnalyticsReport(data)}
      >
        <Download className="size-4" />
        Export Report
      </Button>
    </div>
  );
}
