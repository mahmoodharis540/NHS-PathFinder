import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import FontProvider from "@/components/Font";
import HighContrast from "@/components/HighContrastProvider";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { TranslationProvider } from "@/components/TranslationProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NHS Pathfinder",
  description: "Navigate NHS buildings with ease.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body
        className={[
          geistSans.variable,
          geistMono.variable,
          "min-h-screen",
          "bg-gray-100",
          "text-gray-900",
          "antialiased",
        ].join(" ")}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <TranslationProvider>
            <FontProvider>
              <HighContrast>{children}</HighContrast>
            </FontProvider>
          </TranslationProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}