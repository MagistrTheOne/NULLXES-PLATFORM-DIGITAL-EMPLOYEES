import type { Metadata } from "next";
import { getCurrentSession } from "@/features/auth/services/get-current-session";
import { LandingPage } from "@/features/landing/components/landing-page";
import { getAdelineLandingPlaque } from "@/features/landing/services/get-adeline-landing-plaque";

export const metadata: Metadata = {
  title: "NULLXES — Цифровые сотрудники | Digital Employees",
  description:
    "NULLXES — Цифровые сотрудники для бизнеса. Digital Employees platform: deploy governed digital workers for support, operations, and public services.",
  openGraph: {
    title: "NULLXES — Цифровые сотрудники | Digital Employees",
    description:
      "Создавайте и управляйте цифровыми сотрудниками. Create and manage Digital Employees at enterprise scale.",
  },
};

export default async function HomePage() {
  const [session, plaque] = await Promise.all([
    getCurrentSession(),
    getAdelineLandingPlaque(),
  ]);

  return <LandingPage signedIn={Boolean(session)} plaque={plaque} />;
}
