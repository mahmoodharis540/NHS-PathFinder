import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AccessibilityProvider from "./providers/AccessibilityProvider.tsx";

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

export default function RootLayout({
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
