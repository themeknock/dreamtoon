import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Fraunces } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  axes: ["opsz"],
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono-sans",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["SOFT", "WONK", "opsz"],
});

export const metadata: Metadata = {
  title: "DreamToon — Talk. Get a comic.",
  description:
    "Tap the mic, talk for fifteen seconds, watch your dream become a 4-panel comic.",
  metadataBase: new URL("https://dreamtoon.app"),
  openGraph: {
    title: "DreamToon",
    description: "Talk. Get a comic.",
    url: "https://dreamtoon.app",
    siteName: "DreamToon",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DreamToon",
    description: "Talk. Get a comic.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f6f0e1",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-theme="light"
      className={`${inter.variable} ${mono.variable} ${fraunces.variable}`}
    >
      <body className="cream-bg paper-grain min-h-screen">
        <div className="paper-grain-overlay" aria-hidden="true" />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:rounded focus:bg-paper focus:px-3 focus:py-2 focus:text-ink"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
