import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { loadMessages } from "@/i18n/load-messages";
import { getRequestLocale } from "@/i18n/request";
import { IntlProvider } from "@/shared/i18n/intl-provider";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NULLXES Digital Employees",
  description: "Digital Workforce Operating System",
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
        "dark h-full antialiased",
        geistSans.variable,
        geistMono.variable,
        "font-sans",
        inter.variable,
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
