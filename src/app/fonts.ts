// Fonts from the style guide, shared by the root layout and the root error page.
// next/font downloads them at build time, so the browser never calls Google Fonts directly
// (faster + more private).
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/** Put these classes on <html>: they define the font variables the CSS uses. */
export const fontVariables = `${geistSans.variable} ${geistMono.variable}`;
