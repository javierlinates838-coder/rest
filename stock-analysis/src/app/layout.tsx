import type { Metadata } from "next";
import Link from "next/link";
import { Inter } from "next/font/google";
import { MobileNav } from "@/components/mobile-nav";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "StockPulse AI — Deep Stock Analysis",
  description: "AI-powered stock analysis with live data from FMP, Finnhub, and Google Gemini. Technical indicators, competitor analysis, and smart buy/sell recommendations.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark w-full">
      <body className={`${inter.variable} antialiased min-h-screen w-full max-w-[100vw] overflow-x-hidden`}>
        <div className="app-canvas flex flex-col min-h-screen w-full min-w-0">
          <nav className="sticky top-0 z-50 nav-premium safe-top">
            <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
              <div className="flex items-center justify-between h-14 sm:h-[60px] gap-3">
                <Link href="/" className="flex items-center gap-2 sm:gap-3 group min-w-0 pressable">
                  <div className="logo-float w-8 h-8 shrink-0 rounded-[10px] bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 hero-glow-ring group-hover:shadow-indigo-500/50 transition-shadow duration-300">
                    <svg className="w-[18px] h-[18px] text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <span className="text-[15px] sm:text-[17px] font-semibold tracking-tight gradient-text truncate">StockPulse AI</span>
                </Link>

                <div className="flex items-center gap-2 sm:gap-6 shrink-0">
                  <MobileNav />
                  <div className="hidden sm:flex items-center gap-6">
                    <Link href="/" className="nav-link text-[13px] font-medium text-zinc-400">Dashboard</Link>
                    <Link href="/watchlist" className="nav-link text-[13px] font-medium text-zinc-400">Watchlist</Link>
                    <Link href="/portfolio" className="nav-link text-[13px] font-medium text-zinc-400">Portfolio</Link>
                  </div>
                  <span className="live-badge text-zinc-400 text-[9px] sm:text-[10px]">Live</span>
                </div>
              </div>
            </div>
          </nav>

          <main className="flex-1 pb-safe w-full min-w-0 overflow-x-hidden page-enter">{children}</main>

          <footer className="border-t border-white/[0.04] py-5 safe-bottom">
            <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 text-[10px] sm:text-[11px] text-zinc-600 text-center sm:text-left">
                <span className="tracking-wide">StockPulse AI — Not financial advice.</span>
                <div className="flex flex-wrap justify-center gap-2">
                  <span className="data-source-tag">FMP</span>
                  <span className="data-source-tag">Finnhub</span>
                  <span className="data-source-tag">Gemini AI</span>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
