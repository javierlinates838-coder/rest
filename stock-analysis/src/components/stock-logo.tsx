"use client";

import { useState } from "react";

const COLORS = [
  "from-indigo-500 to-purple-600",
  "from-emerald-500 to-teal-600",
  "from-blue-500 to-cyan-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-violet-500 to-fuchsia-600",
];

function colorForSymbol(symbol: string): string {
  let h = 0;
  for (let i = 0; i < symbol.length; i++) h = (h + symbol.charCodeAt(i)) | 0;
  return COLORS[Math.abs(h) % COLORS.length];
}

function logoUrl(symbol: string): string {
  return `https://financialmodelingprep.com/image-stock/${encodeURIComponent(symbol.toUpperCase())}.png`;
}

export function StockLogo({
  symbol,
  size = 40,
  className = "",
}: {
  symbol: string;
  size?: number;
  className?: string;
}) {
  const sym = symbol.toUpperCase().replace(/[^A-Z0-9.-]/g, "");
  const [failed, setFailed] = useState(false);

  if (!sym) return null;

  const px = `${size}px`;

  if (failed) {
    return (
      <div
        className={`shrink-0 rounded-xl bg-gradient-to-br ${colorForSymbol(sym)} flex items-center justify-center font-bold text-white shadow-lg ${className}`}
        style={{ width: px, height: px, fontSize: size * 0.32 }}
        aria-hidden
      >
        {sym.slice(0, 2)}
      </div>
    );
  }

  return (
    <img
      src={logoUrl(sym)}
      alt={`${sym} logo`}
      width={size}
      height={size}
      className={`shrink-0 rounded-xl object-contain bg-white/95 p-0.5 shadow-md ${className}`}
      style={{ width: px, height: px }}
      onError={() => setFailed(true)}
      loading="lazy"
    />
  );
}
