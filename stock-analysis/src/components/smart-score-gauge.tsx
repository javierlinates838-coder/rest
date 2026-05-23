"use client";

import { smartScoreColor } from "@/lib/smart-score";

interface SmartScoreGaugeProps {
  score: number;
  label?: string;
  size?: "sm" | "md" | "lg";
}

const SIZES = {
  sm: { box: 72, stroke: 5, font: "text-lg" },
  md: { box: 96, stroke: 6, font: "text-2xl" },
  lg: { box: 120, stroke: 7, font: "text-3xl" },
};

export function SmartScoreGauge({ score, label, size = "md" }: SmartScoreGaugeProps) {
  const { box, stroke, font } = SIZES[size];
  const r = (box - stroke * 2) / 2 - 2;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  const color =
    score >= 75 ? "#34d399" : score >= 58 ? "#4ade80" : score <= 25 ? "#f87171" : score <= 42 ? "#fb923c" : "#fbbf24";

  return (
    <div className="smart-gauge flex flex-col items-center">
      <div className="relative" style={{ width: box, height: box }}>
        <svg width={box} height={box} className="-rotate-90">
          <circle
            cx={box / 2}
            cy={box / 2}
            r={r}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={stroke}
          />
          <circle
            cx={box / 2}
            cy={box / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            className="smart-gauge-ring transition-all duration-1000 ease-out"
            style={{ filter: `drop-shadow(0 0 8px ${color}55)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-mono font-bold tabular-nums leading-none ${font} ${smartScoreColor(score)}`}>
            {score}
          </span>
        </div>
      </div>
      {label && (
        <span className="text-[10px] font-semibold tracking-wider uppercase text-zinc-500 mt-2">{label}</span>
      )}
    </div>
  );
}
