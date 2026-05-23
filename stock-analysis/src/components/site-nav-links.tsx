"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV } from "@/lib/brand";

export function SiteNavLinks() {
  const pathname = usePathname() || "/";

  return (
    <div className="hidden md:flex lg:items-center gap-3 lg:gap-5 flex-wrap justify-end max-w-[min(100%,520px)]">
      {NAV.map((link) => {
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
