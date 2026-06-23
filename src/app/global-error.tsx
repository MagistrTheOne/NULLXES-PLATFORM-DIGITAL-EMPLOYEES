"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-black text-white">
        <div className="mx-auto flex min-h-svh max-w-lg flex-col items-center justify-center gap-4 px-6 text-center">
          <h1 className="text-xl font-medium">Something went wrong</h1>
          <p className="text-sm text-white/60">
            An unexpected error occurred. You can try again or return to the
            dashboard.
          </p>
          <button
            type="button"
            className="rounded-md border border-white/12 px-4 py-2 text-sm hover:bg-white/5"
            onClick={() => reset()}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
