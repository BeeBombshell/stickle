import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import DashboardShell from "./DashboardShell";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Stickle — Web Dashboard & Annotation Explorer",
    template: "%s | Stickle",
  },
  description:
    "Leave notes in the margins of the web. Search, filter, and manage persistent anchored web sticky notes across every device.",
  keywords: [
    "stickle",
    "web notes",
    "browser annotations",
    "dom anchoring",
    "cross device sync",
    "notion export",
    "mcp server",
    "claude desktop",
    "local first",
  ],
  robots: {
    index: false,
    follow: false,
  },
  verification: {
    google: "iztnXGKuIWicmeU4IWIBTxJGwWz_ubRViANYbmH_oAw",
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  openGraph: {
    title: "Stickle — Web Dashboard & Annotation Explorer",
    description:
      "Leave notes in the margins of the web. Search, filter, and manage persistent anchored web sticky notes across every device.",
    url: "https://stickle.app/notes",
    siteName: "Stickle",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        type: "image/png",
        alt: "Stickle — Web Dashboard & Cross-Device Notes",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Stickle — Web Dashboard & Annotation Explorer",
    description:
      "Leave notes in the margins of the web. Search, filter, and manage persistent anchored web sticky notes across every device.",
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#111111",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <DashboardShell>{children}</DashboardShell>
      </body>
    </html>
  );
}
