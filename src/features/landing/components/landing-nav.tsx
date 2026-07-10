import Link from "next/link";

export function LandingNav({ signedIn }: { signedIn: boolean }) {
  return (
    <header className="relative z-20 flex shrink-0 items-center justify-between gap-6 px-6 py-5 md:px-10 lg:px-14">
      <Link
        href="/"
        className="font-(family-name:--font-landing-serif) text-sm tracking-[0.35em] text-white uppercase"
      >
        NULLXES
      </Link>

      <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 text-[13px] text-white/55 md:flex">
        <a href="#platform" className="transition-colors hover:text-white/85">
          Platform
        </a>
        <a href="#use-case" className="transition-colors hover:text-white/85">
          Solutions
        </a>
        <a href="#enterprise" className="transition-colors hover:text-white/85">
          Enterprise
        </a>
        <a href="#security" className="transition-colors hover:text-white/85">
          Security
        </a>
        <a href="#pricing" className="transition-colors hover:text-white/85">
          Pricing
        </a>
      </nav>

      <div className="flex items-center gap-3">
        {signedIn ? (
          <Link
            href="/dashboard"
            className="rounded-full border border-(--landing-gold)/70 px-4 py-2 text-xs tracking-wide text-(--landing-gold) transition-colors hover:bg-(--landing-gold)/10"
          >
            Go to dashboard
          </Link>
        ) : (
          <Link
            href="/register"
            className="rounded-full border border-(--landing-gold)/70 px-4 py-2 text-xs tracking-wide text-(--landing-gold) transition-colors hover:bg-(--landing-gold)/10"
          >
            Talk to sales
          </Link>
        )}
      </div>
    </header>
  );
}
