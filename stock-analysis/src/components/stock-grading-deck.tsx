"use client";

import { formatLargeNumber, getSignalColor } from "@/lib/utils";
import { SmartScoreGauge } from "@/components/smart-score-gauge";
import { edgeTierColor } from "@/lib/edge-index";
import type { EdgeIndexResult } from "@/lib/edge-index";
import type { SmartScoreResult } from "@/lib/smart-score";
import { smartScoreColor } from "@/lib/smart-score";
import { TERMS } from "@/lib/brand";

export function StockGradingDeck({
  smart,
  signal,
  confidence,
  riskGrade,
  riskScore,
  edge,
  quote,
}: {
  smart: SmartScoreResult;
  signal: string;
  confidence: number;
  riskGrade: string;
  riskScore?: number;
  edge: EdgeIndexResult;
  quote: { marketCap: number; peRatio: number };
}) {
  const lowConviction = confidence < 35;
  const displayConf = Math.max(4, Math.min(100, confidence));
  const signalTone = toneFromSignal(signal);
  const riskLetterClass = letterClassForRisk(riskGrade);

  return (
    <div className="grading-deck grading-deck--hero" aria-label="Conviction grades">
      <div className="grading-deck-row">
        <div className="grading-cell grading-cell--score">
          <span className="grading-label">{TERMS.smartScore}</span>
          <SmartScoreGauge score={smart.score} size="sm" />
          <span className={`grading-score-label ${smartScoreColor(smart.score)}`}>{smart.label}</span>
        </div>

        <div className={`grading-cell grading-cell--signal grading-cell--${signalTone}`}>
          <span className="grading-label">Signal</span>
          <p className={`grading-signal ${getSignalColor(signal)}`}>{signal}</p>
          <div className="grading-conf-track" aria-hidden>
            <div className="grading-conf-fill" style={{ width: `${displayConf}%` }} />
          </div>
          <span className="grading-sublabel">
            {lowConviction ? "Low conviction — wait for clarity" : `${confidence}% model confidence`}
          </span>
        </div>

        <div className="grading-cell grading-cell--risk">
          <span className="grading-label">Risk grade</span>
          <p className={`grading-grade-letter ${riskLetterClass}`}>{riskGrade}</p>
          <span className="grading-sublabel tabular-nums">
            {riskScore != null ? `Score ${riskScore}/100` : "—"}
          </span>
        </div>

        <div className="grading-cell grading-cell--edge">
          <span className="grading-label">{TERMS.edgeShort}</span>
          <p className="grading-edge-main">
            <span className={`grading-edge-num ${edgeTierColor(edge.tier)}`}>{edge.edgeScore}</span>
            <span className={`grading-edge-tier ${edgeTierColor(edge.tier)}`}>{edge.tier}</span>
          </p>
          <div className="grading-edge-mini">
            <span className="grading-edge-mini-item">Conv {edge.conviction}</span>
            <span className="grading-edge-mini-item">Integrity {edge.dataIntegrity}</span>
          </div>
        </div>
      </div>

      {(quote.marketCap > 0 || quote.peRatio > 0) && (
        <div className="grading-footer">
          {quote.marketCap > 0 && (
            <span>
              Mkt cap <strong>{formatLargeNumber(quote.marketCap)}</strong>
            </span>
          )}
          {quote.peRatio > 0 && (
            <span>
              P/E <strong className="tabular-nums">{quote.peRatio.toFixed(1)}</strong>
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function toneFromSignal(signal: string): "bull" | "bear" | "hold" {
  const s = signal.toLowerCase();
  if (s.includes("sell")) return "bear";
  if (s.includes("buy")) return "bull";
  return "hold";
}

function letterClassForRisk(grade: string): string {
  const g = grade.toUpperCase();
  if (g === "A" || g === "B") return "grading-grade-letter--a";
  if (g === "C") return "grading-grade-letter--c";
  return "grading-grade-letter--d";
}
