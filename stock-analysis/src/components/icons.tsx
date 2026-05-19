import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Base({ size = 18, children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </svg>
  );
}

// Category icons — custom designs for the stock analysis platform

export function IconTechnical(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M3 21h18" />
      <path d="M5 21V11l4-5 4 3 6-7" />
      <circle cx="9" cy="6" r="1" fill="currentColor" />
      <circle cx="13" cy="9" r="1" fill="currentColor" />
      <circle cx="19" cy="2" r="1" fill="currentColor" />
    </Base>
  );
}

export function IconFundamental(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M3 3v18h18" />
      <rect x="6" y="13" width="3" height="5" rx="0.5" />
      <rect x="11" y="9" width="3" height="9" rx="0.5" />
      <rect x="16" y="5" width="3" height="13" rx="0.5" />
    </Base>
  );
}

export function IconSentiment(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 3a9 9 0 109 9" />
      <path d="M21 3l-9 9" />
      <path d="M8 14c1 1.5 2.5 2 4 2s3-.5 4-2" />
      <circle cx="9" cy="10" r="0.5" fill="currentColor" />
      <circle cx="15" cy="10" r="0.5" fill="currentColor" />
    </Base>
  );
}

export function IconManipulation(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 2v3" />
      <path d="M5 9a7 7 0 0114 0v6a3 3 0 01-3 3H8a3 3 0 01-3-3V9z" />
      <path d="M9 21h6" />
      <path d="M10 12h.01M14 12h.01" />
      <path d="M9.5 16c.5-.7 1.5-1 2.5-1s2 .3 2.5 1" />
    </Base>
  );
}

export function IconVolatility(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M11 3L4 14h6l-1 7 7-11h-6l1-7z" fill="currentColor" fillOpacity="0.15" />
      <path d="M11 3L4 14h6l-1 7 7-11h-6l1-7z" />
    </Base>
  );
}

export function IconCheck(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="10" fill="currentColor" fillOpacity="0.15" />
      <path d="M8 12l3 3 5-6" strokeWidth={2} />
    </Base>
  );
}

export function IconInsider(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="11" cy="11" r="6" />
      <path d="M11 8a3 3 0 100 6 3 3 0 000-6z" />
      <path d="M15.5 15.5L21 21" />
      <path d="M9 11h4" />
    </Base>
  );
}

export function IconVolume(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="3" y="14" width="3" height="7" rx="0.5" />
      <rect x="8" y="10" width="3" height="11" rx="0.5" />
      <rect x="13" y="6" width="3" height="15" rx="0.5" />
      <rect x="18" y="2" width="3" height="19" rx="0.5" />
      <path d="M3 14l5-4 5-4 5-4" strokeDasharray="2 2" />
    </Base>
  );
}

export function IconPumpDump(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M3 18l4-6 4 3 5-9 5 3" />
      <path d="M14 6l4 0 0 4" />
      <circle cx="3" cy="18" r="1" fill="currentColor" />
      <circle cx="7" cy="12" r="1" fill="currentColor" />
      <circle cx="11" cy="15" r="1" fill="currentColor" />
      <circle cx="16" cy="6" r="1" fill="currentColor" />
    </Base>
  );
}

export function IconPriceGap(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M3 12h6" />
      <path d="M15 12h6" />
      <path d="M9 7l6 10" strokeDasharray="2 2" />
      <circle cx="9" cy="7" r="1.5" fill="currentColor" />
      <circle cx="15" cy="17" r="1.5" fill="currentColor" />
    </Base>
  );
}

export function IconDivergence(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M3 6l6 6 6-3 6 3" />
      <path d="M3 18l6-3 6 3 6-6" />
      <circle cx="21" cy="9" r="1" fill="currentColor" />
      <circle cx="21" cy="12" r="1" fill="currentColor" />
    </Base>
  );
}

export function IconVolatilitySpike(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M3 12h3l2-7 4 14 3-10 3 6h3" />
      <circle cx="3" cy="12" r="0.5" fill="currentColor" />
      <circle cx="21" cy="12" r="0.5" fill="currentColor" />
    </Base>
  );
}

export function IconEarnings(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 9h18" />
      <path d="M8 3v4M16 3v4" />
      <path d="M8 13h2l1 2 1-4 1 2h2" />
    </Base>
  );
}

export function IconDividend(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 6v12" />
      <path d="M15 8.5c-.5-1-1.5-1.5-3-1.5s-3 .8-3 2 1 2 3 2 3 1 3 2.5-1.5 2.5-3 2.5-2.5-.5-3-1.5" />
    </Base>
  );
}

export function IconFed(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M3 22h18" />
      <path d="M5 22V10" />
      <path d="M19 22V10" />
      <path d="M9 22V10" />
      <path d="M15 22V10" />
      <path d="M2 10h20" />
      <path d="M12 2l10 6H2l10-6z" fill="currentColor" fillOpacity="0.1" />
    </Base>
  );
}

export function IconEconomic(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M3 17l6-6 4 4 8-8" />
      <path d="M14 7l7 0 0 7" />
      <circle cx="3" cy="17" r="1" fill="currentColor" />
      <circle cx="9" cy="11" r="1" fill="currentColor" />
      <circle cx="13" cy="15" r="1" fill="currentColor" />
    </Base>
  );
}

export function IconGuidance(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
      <path d="M22 2l-6 6" />
    </Base>
  );
}

export function IconSplit(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M7 7L17 17M17 7L7 17" />
      <path d="M3 12h2M19 12h2M12 3v2M12 19v2" />
    </Base>
  );
}

export function IconCalendar(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 9h18" />
      <path d="M8 3v4M16 3v4" />
    </Base>
  );
}

export function IconShield(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z" />
      <path d="M9 12l2 2 4-4" strokeWidth={2} />
    </Base>
  );
}

export function IconAlert(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 9v4M12 17h.01" />
      <path d="M10.3 3.7L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.7a2 2 0 00-3.4 0z" />
    </Base>
  );
}

export function IconStar(props: IconProps & { filled?: boolean }) {
  const { filled, ...rest } = props;
  return (
    <Base {...rest}>
      <path
        d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8l-6.2 3.2 1.2-6.8-5-4.9 6.9-1L12 2z"
        fill={filled ? "currentColor" : "none"}
      />
    </Base>
  );
}

export function IconRefresh(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M3 12a9 9 0 0114-7l2-2v6h-6l2.5-2.5" />
      <path d="M21 12a9 9 0 01-14 7l-2 2v-6h6L8.5 17.5" />
    </Base>
  );
}

export function IconLink(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M10 13a5 5 0 007 0l3-3a5 5 0 00-7-7l-1 1" />
      <path d="M14 11a5 5 0 00-7 0l-3 3a5 5 0 007 7l1-1" />
    </Base>
  );
}

export function IconClock(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </Base>
  );
}

export function IconArrowUp(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 19V5M5 12l7-7 7 7" strokeWidth={2} />
    </Base>
  );
}

export function IconArrowDown(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 5v14M5 12l7 7 7-7" strokeWidth={2} />
    </Base>
  );
}

export function IconArrowRight(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M5 12h14M12 5l7 7-7 7" strokeWidth={2} />
    </Base>
  );
}

export function IconTarget(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
    </Base>
  );
}

export function IconStop(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 2L3 7v5c0 5 3.5 9 9 10 5.5-1 9-5 9-10V7l-9-5z" />
      <path d="M9 9h6v6H9z" fill="currentColor" />
    </Base>
  );
}

export function IconBuy(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 7v10M7 12h10" strokeWidth={2.5} />
    </Base>
  );
}

export function IconSell(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M7 12h10" strokeWidth={2.5} />
    </Base>
  );
}

export function IconDollar(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v12" />
      <path d="M15 9.5c-.5-1.5-2-2-3-2s-3 .5-3 2.5 1.5 2 3 2 3 1 3 2.5-1.5 2.5-3 2.5-2.5-.5-3-2" />
    </Base>
  );
}

export function IconNews(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M7 8h7M7 12h10M7 16h10" />
      <rect x="16" y="7" width="2" height="3" rx="0.3" />
    </Base>
  );
}

export function IconBullish(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M3 17l6-6 4 4 8-8" />
      <path d="M14 7l7 0 0 7" />
    </Base>
  );
}

export function IconBearish(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M3 7l6 6 4-4 8 8" />
      <path d="M14 17l7 0 0-7" />
    </Base>
  );
}

export function IconPattern(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M8 12l2 2 4-4 2 2" />
      <path d="M16 8h.01" />
    </Base>
  );
}

export function IconChart(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M3 3v18h18" />
      <path d="M7 14l3-3 3 3 5-7" />
    </Base>
  );
}

// Decorative grade badge
export function GradeBadge({ grade, className = "" }: { grade: string; className?: string }) {
  const colors: Record<string, string> = {
    A: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    B: "text-green-400 bg-green-500/10 border-green-500/20",
    C: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    D: "text-orange-400 bg-orange-500/10 border-orange-500/20",
    F: "text-red-400 bg-red-500/10 border-red-500/20",
  };
  return (
    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl border font-bold text-[22px] tracking-tight ${colors[grade] || colors.C} ${className}`}>
      {grade}
    </div>
  );
}
