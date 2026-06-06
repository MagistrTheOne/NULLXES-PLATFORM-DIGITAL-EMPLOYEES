"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

function getSettingsErrorMessage(error: Error): string {
  const needsMigration =
    error.name === "OrganizationSettingsTableMissingError" ||
    error.name === "OrganizationSettingsMigrationPendingError" ||
    error.message.includes("organization_settings");

  if (process.env.NODE_ENV === "development" && needsMigration) {
    return "The settings schema is not applied yet. Run npm run db:migrate, then reload this page.";
  }

  return "Something went wrong while loading workspace settings.";
}

export default function SettingsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Settings page error", error);
  }, [error]);

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-4 px-4 py-16 text-center">
      <h1 className="text-xl font-medium text-white">Settings unavailable</h1>
      <p className="text-sm leading-relaxed text-white/55">
        {getSettingsErrorMessage(error)}
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
