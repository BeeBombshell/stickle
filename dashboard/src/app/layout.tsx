import type { Metadata } from "next";
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
  title: "Stickle — Web Dashboard & Cross-Device Notes",
  description: "Search, filter, and manage your anchored web notes across every device.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${jetbrainsMono.variable} bg-[#f8f8f6] text-[#111111] min-h-screen flex flex-col antialiased`}>
        {/* Top Navbar adhering to DESIGN.md monochrome chrome */}
        <header className="sticky top-0 z-50 bg-white border-b border-[#e5e5e5]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            {/* Logo lockup */}
            <Link href="/notes" className="flex items-center gap-3 group">
              <div className="w-8 h-8 rounded-lg bg-[#111111] flex items-center justify-center relative shadow-sm group-hover:scale-105 transition-transform">
                {/* SVG Anchor Pin Logo Mark */}
                <svg width="20" height="20" viewBox="0 0 40 40" fill="none">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 10C12 8.89543 12.8954 8 14 8H26C27.1046 8 28 8.89543 28 10V22C28 23.1046 27.1046 24 26 24H21V29L24 30V32H16V30L19 29V24H14C12.8954 24 12 23.1046 12 22V10ZM14 10H26V22H14V10Z" fill="white" />
                  <circle cx="31" cy="31" r="5" fill="#e4f579" />
                </svg>
              </div>
              <span className="font-semibold text-lg tracking-tight">Stickle</span>
              <span className="text-xs font-mono tracking-wider uppercase px-2 py-0.5 rounded-full bg-[#e4f579] text-[#111111] font-medium">
                Dashboard
              </span>
            </Link>

            {/* Navigation links with Lime active pill accents */}
            <nav className="flex items-center gap-2">
              <Link
                href="/notes"
                className="px-4 py-1.5 rounded-full text-sm font-medium transition-all bg-[#e4f579] text-[#111111]"
              >
                Notes
              </Link>
              <Link
                href="/timeline"
                className="px-4 py-1.5 rounded-full text-sm font-medium transition-all text-[#111111]/70 hover:text-[#111111] hover:bg-[#f0f0ed]"
              >
                Timeline
              </Link>
              <Link
                href="/settings/api-keys"
                className="px-4 py-1.5 rounded-full text-sm font-medium transition-all text-[#111111]/70 hover:text-[#111111] hover:bg-[#f0f0ed]"
              >
                API Keys (MCP)
              </Link>
            </nav>

            {/* Profile / Auth CTA */}
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="px-5 py-2 rounded-full bg-[#111111] text-white text-sm font-medium hover:bg-black/90 transition-colors shadow-sm"
              >
                Sign In
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
