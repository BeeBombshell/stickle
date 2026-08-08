import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

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
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
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
        url: "/og-image.svg",
        width: 1200,
        height: 630,
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
    images: ["/og-image.svg"],
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
      <body className={`${inter.variable} ${jetbrainsMono.variable} bg-white text-[#111111] min-h-screen flex flex-col antialiased`}>
        {/* Sticky Nav Bar strictly matching landing & onboarding pages */}
        <nav className="sticky top-0 z-50 bg-white border-b border-[#e5e5e0] h-[56px] flex items-center">
          <div className="max-w-[1280px] w-full mx-auto px-6 flex items-center justify-between">
            {/* Logo Lockup with White Anchor Pin Dot */}
            <Link href="/notes" className="flex items-center gap-2.5 text-decoration-none group">
              <div className="w-9 h-9 bg-[#111111] rounded-[10px] flex items-center justify-center transition-transform group-hover:scale-105 relative">
                {/* SVG Anchor Pin Mark with White Dot */}
                <svg width="20" height="20" viewBox="0 0 44 44" fill="none">
                  <rect width="44" height="44" rx="10" fill="#111111"/>
                  <circle cx="31" cy="31" r="9" fill="#FFFFFF"/>
                  <circle cx="31" cy="31" r="3.5" fill="#111111"/>
                </svg>
              </div>
              <span className="text-[20px] font-extrabold tracking-[-0.8px] text-[#111111] font-sans">
                stickle
              </span>
              <span className="eyebrow-lime text-[9px] uppercase tracking-[0.6px] font-mono ml-1">
                Dashboard
              </span>
            </Link>

            {/* Nav Links with Pill Styling */}
            <div className="flex items-center gap-2">
              <Link
                href="/notes"
                className="btn-pill btn-lime text-xs font-semibold px-4 py-1.5"
              >
                Notes Explorer
              </Link>
              <Link
                href="/timeline"
                className="btn-pill text-xs text-[#52514e] hover:text-[#111111] hover:bg-[#f8f8f6] px-4 py-1.5"
              >
                Timeline
              </Link>
              <Link
                href="/settings/api-keys"
                className="btn-pill text-xs text-[#52514e] hover:text-[#111111] hover:bg-[#f8f8f6] px-4 py-1.5"
              >
                API Keys (MCP)
              </Link>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Link href="/login" className="btn-pill btn-primary text-xs px-5 py-2">
                Sign In
              </Link>
            </div>
          </div>
        </nav>

        {/* Main Content Container */}
        <main className="flex-1 max-w-[1280px] w-full mx-auto px-6 py-10">
          {children}
        </main>
      </body>
    </html>
  );
}
