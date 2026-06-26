"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { isTransientDatabaseError } from "@/shared/errors/is-transient-database-error";

export default function HqError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isDatabaseUnavailable = isTransientDatabaseError(error);

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-4 px-4 py-16 text-center">
      <h1 className="text-xl font-medium text-white">HQ unavailable</h1>
      <p className="text-sm leading-relaxed text-white/55">
        {isDatabaseUnavailable
          ? "Could not reach the database to load the headquarters view. Check your network and database connection, then try again."
          : "Something went wrong while loading the headquarters simulation."}
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
