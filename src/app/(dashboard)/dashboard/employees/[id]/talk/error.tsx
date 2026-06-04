"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function EmployeeTalkError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Employee Talk page error", error);
  }, [error]);

  const isDatabaseUnavailable =
    error.message.toLowerCase().includes("failed to get session") ||
    error.message.toLowerCase().includes("fetch failed") ||
    error.message.toLowerCase().includes("database");

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-4 px-4 py-16 text-center">
      <h1 className="text-xl font-medium text-white">Talk session unavailable</h1>
      <p className="text-sm leading-relaxed text-white/55">
        {isDatabaseUnavailable
          ? "Could not reach the database to verify your session. Check your network and DATABASE_URL (Neon), then try again."
          : "Something went wrong while loading this Talk session."}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button type="button" onClick={() => reset()}>
          Try again
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard/employees">Back to employees</Link>
        </Button>
      </div>
    </div>
  );
}
