import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";

import { SiteHeader } from "@/components/site-header";
import { Toast } from "@/components/toast";

import "./globals.css";

// Fonts from the style guide. next/font downloads them at build time,
// so the browser never calls Google Fonts directly (faster + more private).
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Study Blog",
    template: "%s · Study Blog",
  },
  description: "Write what you learn. Track how you focus.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {/* Keyboard users can jump over the menu, straight to the page. */}
        <a
          href="#main"
          className="sr-only rounded-lg bg-card px-4 py-3 text-label font-medium focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50"
        >
          Skip to content
        </a>
        <SiteHeader />
        {children}
        {/* The toast reads ?toast= from the URL, which only exists per request. */}
        <Suspense>
          <Toast />
        </Suspense>
      </body>
    </html>
  );
}
