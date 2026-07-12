import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, Figtree } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { loadMessages } from "@/i18n/load-messages";
import { getRequestLocale } from "@/i18n/request";
import { IntlProvider } from "@/shared/i18n/intl-provider";
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

export const metadata: Metadata = {
  metadataBase: new URL("https://www.nullxesdai.online"),
  title: {
    default: "NULLXES — Цифровые сотрудники | Digital Employees",
    template: "%s | NULLXES",
  },
  description:
    "NULLXES — Цифровые сотрудники для enterprise. Digital Employees: create, deploy, and manage a digital workforce with Talk, governance, and security.",
  keywords: [
    "NULLXES",
    "Цифровые сотрудники",
    "Digital Employees",
    "digital workforce",
    "enterprise AI",
    "цифровая рабочая сила",
  ],
  authors: [{ name: "NULLXES" }],
  openGraph: {
    type: "website",
    locale: "ru_RU",
    alternateLocale: ["en_US"],
    url: "https://www.nullxesdai.online",
    siteName: "NULLXES",
    title: "NULLXES — Цифровые сотрудники | Digital Employees",
    description:
      "Платформа цифровых сотрудников / Digital Employees operating system for enterprise.",
    images: [
      {
        url: "/ADEINA.jpg",
        width: 1024,
        height: 1024,
        alt: "NULLXES Digital Employee — Adeline Kalen",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NULLXES — Цифровые сотрудники | Digital Employees",
    description:
      "NULLXES — Цифровые сотрудники. Digital Employees for enterprise operations.",
    images: ["/ADEINA.jpg"],
  },
  alternates: {
    canonical: "https://www.nullxesdai.online",
    languages: {
      ru: "https://www.nullxesdai.online",
      en: "https://www.nullxesdai.online",
      "x-default": "https://www.nullxesdai.online",
    },
  },
  robots: {
    index: true,
    follow: true,
  },
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
      className={cn(
        "dark h-full antialiased font-sans",
        geistSans.variable,
        geistMono.variable,
        inter.variable,
        figtreeHeading.variable,
      )}
    >
      <body className="flex min-h-full flex-col">
        <IntlProvider locale={locale} messages={messages}>
          {children}
        </IntlProvider>
        <Analytics />
      </body>
    </html>
  );
}
