"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { OAuthProviderId } from "../lib/oauth-providers";
import { authClient } from "../client";

const PROVIDER_LABELS: Record<OAuthProviderId, string> = {
  google: "Google",
  github: "GitHub",
};

export function OAuthSignInButtons({
  providers,
  inviteToken,
}: {
  providers: OAuthProviderId[];
  inviteToken: string | null;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pendingProvider, setPendingProvider] = useState<OAuthProviderId | null>(
    null,
  );

  if (providers.length === 0) {
    return null;
  }

  const callbackURL = inviteToken
    ? `/accept-invite?invite=${encodeURIComponent(inviteToken)}`
    : "/dashboard";

  async function handleOAuth(provider: OAuthProviderId): Promise<void> {
    setError(null);
    setPendingProvider(provider);

    const { error: signInError } = await authClient.signIn.social({
      provider,
      callbackURL,
    });

    setPendingProvider(null);

    if (signInError) {
      setError(signInError.message ?? "Unable to continue with OAuth.");
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative py-2">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-white/10" />
        </div>
        <p className="relative mx-auto w-fit bg-[#111111] px-3 text-xs text-white/50">
          Or continue with
        </p>
      </div>
      <div className="grid gap-2">
        {providers.map((provider) => (
          <Button
            key={provider}
            type="button"
            variant="outline"
            disabled={pendingProvider !== null}
            className="border-white/10 bg-black/40 text-white hover:bg-white/5"
            onClick={() => handleOAuth(provider)}
          >
            {pendingProvider === provider
              ? "Redirecting..."
              : `Continue with ${PROVIDER_LABELS[provider]}`}
          </Button>
        ))}
      </div>
      {error ? (
        <p className="text-sm text-white/80" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
