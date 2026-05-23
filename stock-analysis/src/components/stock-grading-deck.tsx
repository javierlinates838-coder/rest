"use client";

import { formatCurrency, formatLargeNumber, formatPercent, getSignalColor } from "@/lib/utils";
import { SmartScoreGauge } from "@/components/smart-score-gauge";
import { edgeTierColor } from "@/lib/edge-index";
import type { EdgeIndexResult } from "@/lib/edge-index";
import type { SmartScoreResult } from "@/lib/smart-score";
import { TERMS } from "@/lib/brand";

function signalSurface(signal: string): "bull" | "bear" | "hold" | "neutral" {
  const s = signal.toLowerCase();
  if (s.includes("strong buy") || s === "buy") return "bull";
  if (s.includes("strong sell") || s === "sell") return "bear";
  if (s === "hold") return "hold";
  return "neutral";
}

function riskGradeSurface(grade: string): string {
  if (grade === "A" || grade === "B") return "grading-risk--low";
  if (grade === "C") return "grading-risk--mid";
  return "grading-risk--high";
}

export function StockGradingDeck({
  smart,
  signal,
  confidence,
  riskGrade,
  riskScore,
  riskVerdict,
  edge,
  quote,
}: {
  smart: SmartScoreResult;
  signal: string;
  confidence: number;
  riskGrade: string;
  riskScore?: number;
  riskVerdict?: string;
  edge: EdgeIndexResult;
  quote: {
    price: number;
    dayLow: number;
    dayHigh: number;
    low52: number;
    high52: number;
    marketCap: number;
    peRatio: number;
  };
}) {
  const signalTone = signalSurface(signal);
  const displayConf = confidence < 35 ? 0 : confidence;
  const lowConviction = confidence < 35;

  const marketStats = [
    quote.dayLow > 0 &&
      quote.dayHigh > 0 && {
        label: "Day range",
        value: `${formatCurrency(quote.dayLow)} – ${formatCurrency(quote.dayHigh)}`,
      },
    quote.low52 > 0 &&
      quote.high52 > 0 && {
        label: "52W range",
        value: `${formatCurrency(quote.low52)} – ${formatCurrency(quote.high52)}`,
      },
    quote.marketCap > 0 && {
      label: "Mkt cap",
      value: formatLargeNumber(quote.marketCap),
    },
    quote.peRatio > 0 && {
      label: "P/E",
      value: quote.peRatio.toFixed(1),
    },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <section className="grading-deck" aria-label="Conviction and risk grades">
      <div className="grading-deck-grid">
        <div className="grading-panel grading-panel--score">
          <span className="grading-panel-label">{TERMS.smartScore}</span>
          <SmartScoreGauge score={smart.score} size="lg" />
          <span className="grading-score-label">{smart.label}</span>
        </div>

        <div className={`grading-panel grading-panel--signal grading-signal--${signalTone}`}>
          <span className="grading-panel-label">Signal</span>
          <p className={`grading-signal-word ${getSignalColor(signal)}`}>{signal}</p>
          <div className="grading-confidence">
            <div className="grading-confidence-track">
              <div
                className="grading-confidence-fill"
                style={{ width: `${Math.max(4, displayConf)}%` }}
              />
            </div>
            <span className="grading-confidence-text">
              {lowConviction ? "Low conviction · displayed as Hold" : `${confidence}% confidence`}
            </span>
          </div>
        </div>

        <div className={`grading-panel grading-panel--risk ${riskGradeSurface(riskGrade)}`}>
          <span className="grading-panel-label">Risk grade</span>
          <span className="grading-risk-letter">{riskGrade}</span>
          <span className="grading-risk-sub">
            {riskScore != null ? `${riskScore}/100` : "—"}
            <span className="grading-risk-hint"> · higher = riskier</span>
          </span>
          {riskVerdict && (
            <p className="grading-risk-verdict">{riskVerdict}</p>
          )}
        </div>

        <div className="grading-panel grading-panel--edge">
          <span className="grading-panel-label">{TERMS.edgeShort}</span>
          <div className="grading-edge-head">
            <span className={`grading-edge-score ${edgeTierColor(edge.tier)}`}>
              {edge.edgeScore}
            </span>
            <span className={`grading-edge-tier ${edgeTierColor(edge.tier)}`}>{edge.tier}</span>
          </div>
          <div className="grading-edge-bars">
            {[
              { label: "Conviction", value: edge.conviction },
              { label: "Data", value: edge.dataIntegrity },
              { label: "Asymmetry", value: edge.riskAsymmetry },
            ].map((b) => (
              <div key={b.label} className="grading-edge-bar-row">
                <span className="grading-edge-bar-label">{b.label}</span>
                <div className="grading-edge-bar-track">
                  <div className="grading-edge-bar-fill" style={{ width: `${b.value}%` }} />
                </div>
                <span className="grading-edge-bar-num">{b.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {marketStats.length > 0 && (
        <div className="grading-market-strip">
          {marketStats.map((stat) => (
            <div key={stat.label} className="grading-market-item">
              <span className="grading-market-label">{stat.label}</span>
              <span className="grading-market-value">{stat.value}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
