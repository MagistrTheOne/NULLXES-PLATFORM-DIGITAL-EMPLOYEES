"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardAnalyticsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isDatabaseUnavailable =
    error.message.toLowerCase().includes("failed to get session") ||
    error.message.toLowerCase().includes("fetch failed") ||
    error.message.toLowerCase().includes("database") ||
    error.message.toLowerCase().includes("neondberror");

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-4 px-4 py-16 text-center">
      <h1 className="text-xl font-medium text-white">Analytics unavailable</h1>
      <p className="text-sm leading-relaxed text-white/55">
        {isDatabaseUnavailable
          ? "Could not reach the database to load analytics. Check your network and database connection, then try again."
          : "Something went wrong while loading analytics for this workspace."}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button type="button" onClick={() => reset()}>
          Try again
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
