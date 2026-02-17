import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AccessibilityProvider from "./providers/AccessibilityProvider.tsx";

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
  return (
    <html lang="en">
      <body
        className={`
          ${geistSans.variable}
          ${geistMono.variable}
          min-h-screen
          antialiased
        `}
        style={{ backgroundColor: "var(--nhs-blue)" }}
      >
        <AccessibilityProvider>
          {children}
        </AccessibilityProvider>
      </body>

    </html>
  );
}
