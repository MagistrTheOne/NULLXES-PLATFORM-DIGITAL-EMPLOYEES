import type { Metadata } from "next";
import { getCurrentSession } from "@/features/auth/services/get-current-session";
import { LandingPage } from "@/features/landing/components/landing-page";
import { getAdelineLandingPlaque } from "@/features/landing/services/get-adeline-landing-plaque";
import { buildPageMetadata, SITE_TITLE_DEFAULT } from "@/shared/seo";

export const metadata: Metadata = buildPageMetadata({
  title: SITE_TITLE_DEFAULT,
  absoluteTitle: true,
  path: "/",
  description:
    "NULLXES — Цифровые сотрудники для бизнеса. Digital Employees platform: deploy governed digital workers for support, operations, and public services.",
});

export default async function HomePage() {
  const [session, plaque] = await Promise.all([
    getCurrentSession(),
    getAdelineLandingPlaque(),
  ]);

  return <LandingPage signedIn={Boolean(session)} plaque={plaque} />;
}
