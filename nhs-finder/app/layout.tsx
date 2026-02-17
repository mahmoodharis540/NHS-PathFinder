import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { NextIntlClientProvider } from "next-intl";
import { cookies } from "next/headers";
import React from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

//merged the [locale] folder layout and page into these. and started using cookies instead of directory.
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  const cookieStore = await cookies();
  const locale = cookieStore.get("locale")?.value || "en";


  let messages;
  try {
    messages = (await import(`@/messages/${locale}.json`)).default;
  } catch {
    console.warn(`No messages for "${locale}", falling back to English.`);
    messages = (await import(`@/messages/en.json`)).default;
  }

  return (
    <html lang={locale}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-[#003087] text-white min-h-screen`}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
