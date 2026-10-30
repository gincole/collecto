import type { Metadata } from "next";
import { DM_Sans, Noto_Sans_Thai } from "next/font/google";
import type { ReactNode } from "react";

import "./globals.css";
import { FeedbackProvider } from "@/components/shared/feedback";

const dmSans = DM_Sans({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-dm-sans",
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
      className={`${dmSans.variable} ${notoSansThai.variable}`}
      data-scroll-behavior="smooth"
      lang="en"
    >
      <body className="font-sans">
        <FeedbackProvider>{children}</FeedbackProvider>
      </body>
    </html>
  );
}
