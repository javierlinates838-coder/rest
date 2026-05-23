/** Custom StockPulse mark — pulse ring + ascending pulse line (not a generic chart icon). */

export function BrandLogo({ size = 36, className = "" }: { size?: number; className?: string }) {
  const id = "pulse-grad";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#5eead4" />
          <stop offset="50%" stopColor="#2dd4bf" />
          <stop offset="100%" stopColor="#fbbf24" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="36" height="36" rx="10" fill="url(#pulse-grad)" opacity="0.95" />
      <circle cx="20" cy="20" r="11" fill="none" stroke="#042f2e" strokeWidth="2" opacity="0.35" />
      <circle cx="20" cy="20" r="7" fill="none" stroke="#042f2e" strokeWidth="1.5" opacity="0.5" />
      <path
        d="M10 24 L14 18 L18 22 L22 14 L26 17 L30 11"
        fill="none"
        stroke="#042f2e"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="30" cy="11" r="2" fill="#042f2e" />
    </svg>
  );
}

export function BrandWordmark({ showPrime = false }: { showPrime?: boolean }) {
  return (
    <div className="min-w-0 leading-tight">
      <span className="block text-[15px] sm:text-[17px] font-bold tracking-tight text-white truncate font-[family-name:var(--font-display)]">
        StockPulse
        {showPrime && <span className="nav-pro-pill">PRIME</span>}
      </span>
      <span className="block text-[10px] font-semibold tracking-[0.18em] uppercase text-teal-400/85 font-mono">
        Pulse Terminal
      </span>
    </div>
  );
}
