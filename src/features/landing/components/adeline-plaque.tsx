"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { AudioLines } from "lucide-react";
import { XaiVoiceCallSheet } from "@/features/xai-voice/components/xai-voice-call-sheet";
import { LANDING_DEMO_EMPLOYEE_ID } from "@/shared/config/xai-voice-env";
import { LANDING_DEMO_MARKETING_PORTRAIT } from "../lib/adeline-marketing";
import type { AdelineLandingPlaque } from "../services/get-adeline-landing-plaque";
import { LandingAnamDemoOverlay } from "./landing-anam-demo-overlay";

const DEMO_TRIAL_SECONDS = 60;
const DEMO_VOICE_ENDPOINT = "/api/landing/adeline-demo/voice";

/**
 * Landing demo plaque — Talk = Anam avatar, Voice = xAI audio.
 * Both stay on the marketing page (no dashboard).
 */
export function AdelinePlaque({
  plaque,
}: {
  plaque: AdelineLandingPlaque;
  signedIn?: boolean;
}) {
  const t = useTranslations("landing.plaque");
  const [talkOpen, setTalkOpen] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const employeeId = plaque.id || LANDING_DEMO_EMPLOYEE_ID;
  const portrait =
    plaque.avatarPreviewUrl?.trim() || LANDING_DEMO_MARKETING_PORTRAIT;

  return (
    <>
      <article
        data-employee-id={employeeId}
        className="flex w-full max-w-[360px] flex-col overflow-hidden rounded-[1.35rem] border border-(--landing-gold)/45 bg-[#0a0a0a] shadow-[0_30px_80px_rgba(0,0,0,0.55)]"
      >
        <div className="relative aspect-4/5 w-full overflow-hidden bg-black">
          <Image
            src={portrait}
            alt={plaque.name}
            fill
            priority
            className="object-cover object-[50%_12%] scale-[1.08]"
            sizes="(max-width: 1024px) 320px, 360px"
          />
          <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/90 via-black/15 to-transparent" />
        </div>

        <div className="flex items-end justify-between gap-4 border-t border-white/5 px-5 py-4">
          <div className="min-w-0">
            <p className="truncate text-[15px] font-medium tracking-tight text-white">
              {plaque.name}
            </p>
            <p className="mt-0.5 truncate text-xs tracking-wide text-(--landing-gold)">
              {t("role")}
            </p>
          </div>
          <div className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/15 bg-black/60 px-3 py-1.5 text-[11px] text-white/70">
            <span
              className="size-1.5 rounded-full bg-white/55"
              aria-hidden
            />
            <span>{t("available")}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-white/5 px-5 py-4">
          <button
            type="button"
            data-adeline-talk
            onClick={() => setTalkOpen(true)}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-white text-sm font-medium text-black transition-opacity hover:opacity-90"
          >
            {t("talkCta")}
          </button>
          <button
            type="button"
            onClick={() => setVoiceOpen(true)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/15 bg-transparent text-sm text-white transition-colors hover:border-white/30 hover:bg-white/5"
          >
            <AudioLines className="size-4" />
            {t("voiceCta")}
          </button>
        </div>
      </article>

      <LandingAnamDemoOverlay
        open={talkOpen}
        onOpenChange={setTalkOpen}
        employeeName={plaque.name}
        avatarPreviewUrl={portrait}
      />

      <XaiVoiceCallSheet
        open={voiceOpen}
        onOpenChange={setVoiceOpen}
        employeeId={employeeId}
        employeeName={plaque.name}
        avatarPreviewUrl={portrait}
        translationNamespace="employees.talk.xaiVoice"
        sessionEndpoint={DEMO_VOICE_ENDPOINT}
        maxDurationSec={DEMO_TRIAL_SECONDS}
        trialLabel={t("trialLabel")}
      />
    </>
  );
}
