import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "StockPulse AI - Deep Stock Analysis Platform",
  description: "AI-powered stock analysis with technical indicators, competitor analysis, and smart buy/sell recommendations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} antialiased min-h-screen`}>
        <div className="flex flex-col min-h-screen">
          <nav className="sticky top-0 z-50 glass-card border-b border-zinc-800/50">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <a href="/" className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <span className="text-xl font-bold gradient-text">StockPulse AI</span>
                </a>
                <div className="flex items-center gap-6">
                  <a href="/" className="text-sm text-zinc-400 hover:text-white transition-colors">Dashboard</a>
                  <a href="/watchlist" className="text-sm text-zinc-400 hover:text-white transition-colors">Watchlist</a>
                  <a href="/portfolio" className="text-sm text-zinc-400 hover:text-white transition-colors">Portfolio</a>
                  <div className="h-4 w-px bg-zinc-700" />
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Markets Open</span>
                  </div>
                </div>
              </div>
            </div>
          </nav>
          <main className="flex-1">
            {children}
          </main>
          <footer className="border-t border-zinc-800/50 py-6">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center text-xs text-zinc-600">
                <span>StockPulse AI - For informational purposes only. Not financial advice.</span>
                <span>Data refreshed in real-time via Yahoo Finance API</span>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
