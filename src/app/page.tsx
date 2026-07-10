import { getCurrentSession } from "@/features/auth/services/get-current-session";
import { LandingPage } from "@/features/landing/components/landing-page";
import { getAdelineLandingPlaque } from "@/features/landing/services/get-adeline-landing-plaque";

export default async function HomePage() {
  const [session, plaque] = await Promise.all([
    getCurrentSession(),
    getAdelineLandingPlaque(),
  ]);

  return (
    <LandingPage signedIn={Boolean(session)} plaque={plaque} />
  );
}
