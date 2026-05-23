import type { Metadata } from "next";
import Link from "next/link";
import { Plus_Jakarta_Sans } from "next/font/google";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { SiteNavLinks } from "@/components/site-nav-links";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
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
      <body className={`${jakarta.variable} font-sans antialiased min-h-screen w-full max-w-[100vw] overflow-x-hidden has-mobile-nav`}>
        <div className="app-canvas flex flex-col min-h-screen w-full min-w-0">
          <nav className="sticky top-0 z-50 nav-premium safe-top">
            <div className="nav-accent-line" aria-hidden />
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10">
              <div className="flex items-center justify-between h-14 sm:h-16 gap-3">
                <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group min-w-0 pressable">
                  <div className="logo-mark logo-float shrink-0">
                    <svg className="w-[18px] h-[18px] text-[#042f2e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div className="min-w-0 leading-tight">
                    <span className="block text-[15px] sm:text-[17px] font-bold tracking-tight text-white truncate">StockPulse</span>
                    <span className="block text-[10px] font-semibold tracking-[0.14em] uppercase text-teal-400/80">Research</span>
                  </div>
                </Link>

                <div className="flex items-center gap-2 sm:gap-6 shrink-0">
                  <SiteNavLinks />
                  <span className="live-badge text-zinc-500 text-[9px] sm:text-[10px]">Live</span>
                </div>
              </div>
            </div>
          </nav>

          <main className="flex-1 pb-mobile-nav sm:pb-safe w-full min-w-0 overflow-x-hidden page-enter">{children}</main>

          <MobileBottomNav />

          <footer className="footer-premium py-6 safe-bottom footer-above-mobile-nav">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 text-[10px] sm:text-[11px] text-zinc-500 text-center sm:text-left">
                <span className="tracking-wide">StockPulse — Not financial advice.</span>
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
