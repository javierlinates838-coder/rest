import type { Metadata } from "next";
import { Inter } from "next/font/google";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} antialiased min-h-screen`}>
        <div className="flex flex-col min-h-screen">
          {/* Navigation */}
          <nav className="sticky top-0 z-50 glass-card border-b border-white/[0.04]">
            <div className="max-w-[1440px] mx-auto px-6 lg:px-10">
              <div className="flex items-center justify-between h-[60px]">
                <a href="/" className="flex items-center gap-3 group">
                  <div className="w-8 h-8 rounded-[10px] bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-shadow">
                    <svg className="w-[18px] h-[18px] text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <span className="text-[17px] font-semibold tracking-tight gradient-text">StockPulse AI</span>
                </a>

                <div className="flex items-center gap-8">
                  <div className="hidden sm:flex items-center gap-6">
                    <a href="/" className="text-[13px] font-medium text-zinc-400 hover:text-white transition-colors duration-200">Dashboard</a>
                    <a href="/watchlist" className="text-[13px] font-medium text-zinc-400 hover:text-white transition-colors duration-200">Watchlist</a>
                    <a href="/portfolio" className="text-[13px] font-medium text-zinc-400 hover:text-white transition-colors duration-200">Portfolio</a>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-px bg-zinc-800 hidden sm:block" />
                    <span className="live-badge text-zinc-400">Live Data</span>
                  </div>
                </div>
              </div>
            </div>
          </nav>

          {/* Main Content */}
          <main className="flex-1">{children}</main>

          {/* Footer */}
          <footer className="border-t border-white/[0.04] py-5">
            <div className="max-w-[1440px] mx-auto px-6 lg:px-10">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 text-[11px] text-zinc-600">
                <span className="tracking-wide">StockPulse AI — For informational purposes only. Not financial advice.</span>
                <div className="flex items-center gap-3">
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
