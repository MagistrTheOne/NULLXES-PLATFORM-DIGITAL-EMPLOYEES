import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Inter, Figtree } from "next/font/google";
import { loadMessages } from "@/i18n/load-messages";
import { getRequestLocale } from "@/i18n/request";
import { AnalyticsWhenConsented } from "@/features/privacy/ui/analytics-when-consented";
import { CookieConsentBanner } from "@/features/privacy/ui/cookie-consent-banner";
import { IntlProvider } from "@/shared/i18n/intl-provider";
import {
  buildRootMetadata,
  JsonLd,
  siteJsonLdGraph,
} from "@/shared/seo";
import {
  CloudflareEmailOffClose,
  CloudflareEmailOffOpen,
} from "@/shared/security/cloudflare-email-off";
import "./globals.css";
import { cn } from "@/lib/utils";

const figtreeHeading = Figtree({
  subsets: ["latin"],
  variable: "--font-heading",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = buildRootMetadata();

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
    { media: "(prefers-color-scheme: light)", color: "#000000" },
  ],
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getRequestLocale();
  const messages = loadMessages(locale);

  return (
    <html
      lang={locale}
      dir="ltr"
      className={cn(
        "dark h-full antialiased font-sans",
        geistSans.variable,
        geistMono.variable,
        inter.variable,
        figtreeHeading.variable,
      )}
    >
      <body className="flex min-h-full flex-col bg-black text-white">
        <CloudflareEmailOffOpen />
        <JsonLd data={siteJsonLdGraph()} />
        <IntlProvider locale={locale} messages={messages}>
          {children}
          <CookieConsentBanner />
        </IntlProvider>
        <AnalyticsWhenConsented />
        <CloudflareEmailOffClose />
      </body>
    </html>
  );
}
