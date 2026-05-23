"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Dashboard", match: (p: string) => p === "/" },
  { href: "/screener", label: "Screener", match: (p: string) => p.startsWith("/screener") },
  { href: "/watchlist", label: "Watchlist", match: (p: string) => p.startsWith("/watchlist") },
  { href: "/portfolio", label: "Portfolio", match: (p: string) => p.startsWith("/portfolio") },
  { href: "/compare", label: "Compare", match: (p: string) => p.startsWith("/compare") },
  { href: "/alerts", label: "Alerts", match: (p: string) => p.startsWith("/alerts") },
  { href: "/pricing", label: "Pricing", match: (p: string) => p.startsWith("/pricing") },
];

export function SiteNavLinks() {
  const pathname = usePathname() || "/";

  return (
    <div className="hidden lg:flex items-center gap-5">
      {links.map((link) => {
        const active = link.match(pathname);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`nav-link text-[13px] font-medium ${active ? "nav-link-active text-white" : "text-zinc-400"}`}
            aria-current={active ? "page" : undefined}
          >
            {link.label}
          </Link>
        );
      })}
    </div>
  );
}
