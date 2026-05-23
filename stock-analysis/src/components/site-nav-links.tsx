"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Dashboard", match: (p: string) => p === "/" },
  { href: "/watchlist", label: "Watchlist", match: (p: string) => p.startsWith("/watchlist") },
  { href: "/portfolio", label: "Portfolio", match: (p: string) => p.startsWith("/portfolio") },
];

export function SiteNavLinks() {
  const pathname = usePathname() || "/";

  return (
    <div className="hidden sm:flex items-center gap-6">
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
