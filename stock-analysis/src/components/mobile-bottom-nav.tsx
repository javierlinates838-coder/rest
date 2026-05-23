"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MOBILE_NAV } from "@/lib/brand";

function HubIcon({ active }: { active: boolean }) {
  return (
    <svg className="w-[22px] h-[22px]" fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 1.75} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  );
}

function WatchIcon({ active }: { active: boolean }) {
  return (
    <svg className="w-[22px] h-[22px]" fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

function ForgeIcon({ active }: { active: boolean }) {
  return (
    <svg className={`w-[22px] h-[22px] ${active ? "text-teal-300" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 2 : 1.75} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
    </svg>
  );
}

function ScanIcon() {
  return (
    <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="7" strokeWidth={1.75} />
      <path strokeLinecap="round" strokeWidth={1.75} d="M21 21l-4.35-4.35M11 8v6M8 11h6" />
    </svg>
  );
}

const renderIcon = (i: number, active: boolean) => {
  switch (i) {
    case 0:
      return <HubIcon active={active} />;
    case 1:
      return <WatchIcon active={active} />;
    case 2:
      return <ForgeIcon active={active} />;
    default:
      return <ScanIcon />;
  }
};

export function MobileBottomNav() {
  const pathname = usePathname() || "/";

  return (
    <nav className="mobile-bottom-nav lg:hidden" aria-label="Pulse Terminal navigation">
      <div className="mobile-bottom-nav-inner">
        {MOBILE_NAV.map((tab, i) => {
          const active = tab.match(pathname);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`mobile-tab ${active ? "mobile-tab-active" : ""}`}
              aria-current={active ? "page" : undefined}
            >
              <span className="mobile-tab-icon">{renderIcon(i, active)}</span>
              <span className="mobile-tab-label font-mono">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
