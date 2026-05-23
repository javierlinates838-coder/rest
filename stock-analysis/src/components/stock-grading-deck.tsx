"use client";

import { formatLargeNumber, getSignalColor } from "@/lib/utils";
import { SmartScoreGauge } from "@/components/smart-score-gauge";
import { edgeTierColor } from "@/lib/edge-index";
import type { EdgeIndexResult } from "@/lib/edge-index";
import type { SmartScoreResult } from "@/lib/smart-score";
import { TERMS } from "@/lib/brand";

function signalTone(signal: string): "bull" | "bear" | "hold" {
  const s = signal.toLowerCase();
  if (s.includes("buy")) return "bull";
  if (s.includes("sell")) return "bear";
  return "hold";
}

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
  const tone = signalTone(signal);
  const lowConviction = confidence < 35;
  const displayConf = lowConviction ? 0 : confidence;

  return (
    <section className="grading-deck" aria-label="Conviction grades">
      <div className="grading-deck-row">
        <div className="grading-cell grading-cell--score">
          <span className="grading-label">{TERMS.smartScore}</span>
          <SmartScoreGauge score={smart.score} size="md" />
          <span className="grading-sublabel">{smart.label}</span>
        </div>

        <div className={`grading-cell grading-cell--signal grading-cell--${tone}`}>
          <span className="grading-label">Signal</span>
          <p className={`grading-signal ${getSignalColor(signal)}`}>{signal}</p>
          <div className="grading-conf-track">
            <div className="grading-conf-fill" style={{ width: `${Math.max(3, displayConf)}%` }} />
          </div>
          <span className="grading-sublabel">
            {lowConviction ? "Low conviction · shown as Hold" : `${confidence}% confidence`}
          </span>
        </div>

        <div className="grading-cell grading-cell--risk">
          <span className="grading-label">Risk grade</span>
          <p className={`grading-grade-letter grading-grade-letter--${riskGrade.toLowerCase()}`}>
            {riskGrade}
          </p>
          <span className="grading-sublabel">
            {riskScore != null ? `${riskScore}/100` : "—"} · higher = riskier
          </span>
        </div>

        <div className="grading-cell grading-cell--edge">
          <span className="grading-label">{TERMS.edgeShort}</span>
          <p className={`grading-edge-main ${edgeTierColor(edge.tier)}`}>
            <span className="grading-edge-num">{edge.edgeScore}</span>
            <span className="grading-edge-tier">{edge.tier}</span>
          </p>
          <div className="grading-edge-mini">
            {[
              { k: "Conv", v: edge.conviction },
              { k: "Data", v: edge.dataIntegrity },
              { k: "Risk", v: edge.riskAsymmetry },
            ].map((m) => (
              <span key={m.k} className="grading-edge-mini-item">
                {m.k} {m.v}
              </span>
            ))}
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
              P/E <strong>{quote.peRatio.toFixed(1)}</strong>
            </span>
          )}
        </div>
      )}
    </section>
  );
}
