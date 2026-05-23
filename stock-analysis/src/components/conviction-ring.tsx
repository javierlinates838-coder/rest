"use client";

import { smartScoreColor } from "@/lib/smart-score";

export function ConvictionRing({
  score,
  grade,
  caption = "Overall",
  size = 108,
}: {
  score: number;
  grade: string;
  caption?: string;
  size?: number;
}) {
  const stroke = 7;
  const r = (size - stroke * 2) / 2 - 2;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  const color =
    score >= 75 ? "#34d399" : score >= 58 ? "#4ade80" : score <= 35 ? "#f87171" : score <= 48 ? "#fb923c" : "#fbbf24";

  return (
    <div className="cockpit-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="cockpit-ring-svg">
        <defs>
          <filter id="cockpit-glow">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          filter="url(#cockpit-glow)"
          className="cockpit-ring-progress"
        />
      </svg>
      <div className="cockpit-ring-center">
        <span className={`cockpit-ring-score ${smartScoreColor(score)}`}>{score}</span>
        <span className="cockpit-ring-caption">{caption}</span>
        <span className="cockpit-ring-grade">{grade}</span>
      </div>
    </div>
  );
}
