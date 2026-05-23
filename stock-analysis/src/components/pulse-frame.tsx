import type { ReactNode } from "react";

/** Signature corner-bracket frame used on hero panels and key cards. */
export function PulseFrame({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`pulse-frame ${className}`}>
      <span className="pulse-corner pulse-corner-tl" aria-hidden />
      <span className="pulse-corner pulse-corner-tr" aria-hidden />
      <span className="pulse-corner pulse-corner-bl" aria-hidden />
      <span className="pulse-corner pulse-corner-br" aria-hidden />
      <div className="pulse-frame-inner">{children}</div>
    </div>
  );
}
