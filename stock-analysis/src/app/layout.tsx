import type { Metadata } from "next";
import Link from "next/link";
import { Plus_Jakarta_Sans, JetBrains_Mono, Syne } from "next/font/google";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { OnboardingModal } from "@/components/onboarding-modal";
import { SiteNavLinks } from "@/components/site-nav-links";
import { BrandLogo, BrandWordmark } from "@/components/brand-logo";
import { BRAND, FOOTER } from "@/lib/brand";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: BRAND.metaTitle,
  description: BRAND.metaDescription,
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
      <body
        className={`${jakarta.variable} ${jetbrainsMono.variable} ${syne.variable} font-sans antialiased min-h-screen w-full max-w-[100vw] overflow-x-hidden has-mobile-nav`}
      >
        <div className="pulse-rail" aria-hidden />
        <div className="app-canvas flex flex-col min-h-screen w-full min-w-0">
          <nav className="sticky top-0 z-50 nav-premium safe-top">
            <div className="nav-accent-line" aria-hidden />
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10">
              <div className="flex items-center justify-between h-14 sm:h-16 gap-3">
                <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group min-w-0 pressable">
                  <div className="logo-float shrink-0 rounded-xl overflow-hidden shadow-[0_8px_24px_rgba(62,232,211,0.25)]">
                    <BrandLogo size={40} />
                  </div>
                  <BrandWordmark />
                </Link>

                <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                  <SiteNavLinks />
                  <span className="live-badge-pro hidden md:inline-flex">{BRAND.shortTag}</span>
                </div>
              </div>
            </div>
          </nav>

          <main className="flex-1 pb-mobile-nav sm:pb-safe w-full min-w-0 overflow-x-hidden page-enter">
            {children}
          </main>
          <OnboardingModal />

          <MobileBottomNav />

          <footer className="footer-premium py-6 safe-bottom footer-above-mobile-nav">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 text-[10px] sm:text-[11px] text-zinc-500 text-center sm:text-left">
                <span className="tracking-wide font-mono">{FOOTER.legal}</span>
                <div className="flex flex-wrap justify-center gap-2">
                  {FOOTER.feeds.map((tag) => (
                    <span key={tag} className="pulse-feed-tag">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
