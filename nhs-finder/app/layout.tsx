import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import FontProvider from "@/components/Font";
import HighContrast from "@/components/HighContrastProvider";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import ThemeProvider from "@/components/ThemeProvider";
import ThemeToggleButton from "@/components/ThemeToggleButton";
import SettingsButton from "@/components/SettingsButton";
import AccessibilityToolbar from "@/components/AccessibilityToolbar";
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
            <ServiceWorkerRegistration />
            <ThemeProvider>
              <FontProvider>
                <HighContrast>
                  {children}
                  <div className="pointer-events-none fixed right-2 top-2 z-[70] flex items-center gap-2 sm:right-4 sm:top-4 sm:gap-3">
                    <div className="pointer-events-auto">
                      <ThemeToggleButton />
                    </div>
                    <div className="pointer-events-auto">
                      <SettingsButton />
                    </div>
                  </div>
                  <AccessibilityToolbar />
                </HighContrast>
              </FontProvider>
            </ThemeProvider>
          </TranslationProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}