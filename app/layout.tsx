import type { Metadata } from "next";
import { Noto_Sans_Thai, Plus_Jakarta_Sans } from "next/font/google";
import type { ReactNode } from "react";

import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  weight: "variable",
});

const notoSansThai = Noto_Sans_Thai({
  display: "swap",
  subsets: ["thai"],
  variable: "--font-noto-thai",
  weight: "variable",
});

export const metadata: Metadata = {
  description: "A private personal collection and memory library.",
  title: "little things.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html
      className={`${plusJakartaSans.variable} ${notoSansThai.variable}`}
      data-scroll-behavior="smooth"
      lang="en"
    >
      <body className="font-sans">{children}</body>
    </html>
  );
}
