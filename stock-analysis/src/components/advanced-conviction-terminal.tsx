"use client";

import type { AdvancedConviction } from "@/lib/conviction-model";
import type { EdgeIndexResult } from "@/lib/edge-index";
import type { SmartScoreResult } from "@/lib/smart-score";
import { edgeTierColor } from "@/lib/edge-index";
import { smartScoreColor } from "@/lib/smart-score";
import { TERMS } from "@/lib/brand";
import { getSignalColor } from "@/lib/utils";

export function AdvancedConvictionTerminal({
  symbol,
  conviction,
  smart,
  signal,
  edge,
}: {
  symbol: string;
  conviction: AdvancedConviction;
  smart: SmartScoreResult;
  signal: string;
  edge: EdgeIndexResult;
}) {
  return (
    <div className="adv-conviction" aria-label="Advanced conviction model">
      <div className="adv-conviction-head">
        <div className="adv-conviction-grade-block">
          <span className="adv-conviction-grade">{conviction.grade}</span>
          <span className="adv-conviction-grade-sub">Model grade</span>
        </div>
        <div className="adv-conviction-core">
          <div className="adv-conviction-core-top">
            <span className={`adv-conviction-composite ${smartScoreColor(conviction.composite)}`}>
              {conviction.composite}
            </span>
            <span className="adv-conviction-composite-label">Composite conviction</span>
          </div>
          <span className={`adv-regime adv-regime--${regimeSlug(conviction.regime)}`}>
            {conviction.regime}
          </span>
          <p className="adv-regime-detail">{conviction.regimeDetail}</p>
        </div>
        <div className="adv-conviction-edge-block">
          <span className="adv-conviction-edge-label">{TERMS.edgeShort}</span>
          <span className={`adv-conviction-edge-score ${edgeTierColor(edge.tier)}`}>{edge.edgeScore}</span>
          <span className={`adv-conviction-edge-tier ${edgeTierColor(edge.tier)}`}>{edge.tier}</span>
          <span className={`adv-conviction-signal ${getSignalColor(signal)}`}>{signal}</span>
          <span className={`adv-conviction-smart ${smartScoreColor(smart.score)}`}>
            {TERMS.smartScore} {smart.score} · {smart.label}
          </span>
        </div>
      </div>

      <div className="adv-pillars">
        {conviction.pillars.map((p) => (
          <div key={p.id} className="adv-pillar">
            <div className="adv-pillar-top">
              <span className="adv-pillar-label">{p.label}</span>
              <span className={`adv-pillar-score adv-pillar-score--${p.tone}`}>{p.score}</span>
            </div>
            <div className="adv-pillar-track">
              <div
                className={`adv-pillar-fill adv-pillar-fill--${p.tone}`}
                style={{ width: `${p.score}%` }}
              />
            </div>
            <span className="adv-pillar-detail">{p.detail}</span>
            <span className="adv-pillar-weight">{(p.weight * 100).toFixed(0)}% weight</span>
          </div>
        ))}
      </div>

      <div className="adv-conviction-mid">
        <div className="adv-panel">
          <h4 className="adv-panel-title">Trend alignment</h4>
          <div className="adv-align-grid">
            {conviction.alignment.map((a) => (
              <span
                key={a.label}
                className={`adv-align-chip ${a.bullish ? "adv-align-chip--bull" : "adv-align-chip--bear"}`}
              >
                {a.label} {a.bullish ? "▲" : "▼"}
              </span>
            ))}
          </div>
        </div>
        <div className="adv-panel">
          <h4 className="adv-panel-title">Multi-timeframe tape</h4>
          <div className="adv-mtf-row">
            {conviction.mtf.map((m) => (
              <div key={m.label} className="adv-mtf-cell">
                <span className="adv-mtf-label">{m.label}</span>
                <span className={`adv-mtf-val adv-mtf-val--${m.tone}`}>
                  {m.changePercent >= 0 ? "+" : ""}
                  {m.changePercent.toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="adv-panel">
          <h4 className="adv-panel-title">{TERMS.edgeIndex} fusion</h4>
          <div className="adv-blend-list">
            {conviction.edgeBlend.map((b) => (
              <div key={b.label} className="adv-blend-row">
                <span className="adv-blend-label">{b.label}</span>
                <div className="adv-blend-track">
                  <div className="adv-blend-fill" style={{ width: `${b.value}%` }} />
                </div>
                <span className="adv-blend-meta">
                  {b.value} · {(b.weight * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="adv-tactical">
        <span className="adv-tactical-label">Tactical read · {symbol}</span>
        <p className="adv-tactical-text">{conviction.tacticalRead}</p>
        {(edge.drivers.length > 0 || edge.warnings.length > 0) && (
          <div className="adv-drivers-wrap">
            {edge.drivers.map((d) => (
              <span key={d} className="adv-driver-chip">
                ▲ {d}
              </span>
            ))}
            {edge.warnings.map((w) => (
              <span key={w} className="adv-warning-chip">
                ! {w}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function regimeSlug(regime: string): string {
  return regime.toLowerCase().replace(/\s+/g, "-");
}
