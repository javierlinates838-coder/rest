"use client";

import type { ReactNode } from "react";
import type { AdvancedConviction } from "@/lib/conviction-model";
import type { EdgeIndexResult } from "@/lib/edge-index";
import type { SmartScoreResult } from "@/lib/smart-score";
import { edgeTierColor } from "@/lib/edge-index";
import { smartScoreColor } from "@/lib/smart-score";
import { TERMS } from "@/lib/brand";
import { getSignalColor } from "@/lib/utils";
import { scoreVerdict } from "@/lib/score-guide";
import { ConvictionRing } from "@/components/conviction-ring";
import { ScoreLegend, ScoreHierarchyStrip } from "@/components/score-explainer";

export function AdvancedConvictionTerminal({
  symbol,
  conviction,
  smart,
  signal,
  confidence,
  edge,
  riskGrade,
  riskScore,
}: {
  symbol: string;
  conviction: AdvancedConviction;
  smart: SmartScoreResult;
  signal: string;
  confidence: number;
  edge: EdgeIndexResult;
  riskGrade: string;
  riskScore?: number;
}) {
  const bullAlign = conviction.alignment.filter((a) => a.bullish).length;
  const verdict = scoreVerdict(conviction.composite, signal, smart.label);
  const signalDisagrees =
    (smart.label.includes("Buy") && /sell/i.test(signal)) ||
    (smart.label.includes("Sell") && /buy/i.test(signal));

  return (
    <section className="cockpit" aria-label="Pulse conviction cockpit">
      <div className="cockpit-mesh" aria-hidden />

      <ScoreLegend />

      <header className="cockpit-header">
        <div className="cockpit-header-left">
          <ConvictionRing
            score={conviction.composite}
            grade={conviction.grade}
            caption="Overall"
          />
        </div>
        <div className="cockpit-header-main">
          <p className="cockpit-eyebrow">Pulse intelligence · {symbol}</p>
          <p className={`cockpit-signal ${getSignalColor(signal)}`}>{signal}</p>
          <p className="cockpit-verdict">{verdict}</p>
          {signalDisagrees && (
            <p className="cockpit-disagree-note">
              Technical signal and {TERMS.smartScore.toLowerCase()} disagree — use the ranked breakdown below.
            </p>
          )}
          <span className={`cockpit-regime cockpit-regime--${regimeSlug(conviction.regime)}`}>
            {conviction.regime}
          </span>
        </div>
      </header>

      <p className="cockpit-regime-copy">{conviction.regimeDetail}</p>

      <ScoreHierarchyStrip
        composite={conviction.composite}
        grade={conviction.grade}
        signal={signal}
        confidence={confidence}
        smartScore={smart.score}
        smartLabel={smart.label}
        edgeScore={edge.edgeScore}
        edgeTier={edge.tier}
      />

      <p className="cockpit-section-label">Supporting metrics</p>
      <div className="cockpit-kpi-scroll">
        <KpiCard
          label="Pulse Edge"
          hint="Fused trade quality"
          value={String(edge.edgeScore)}
          meta={edge.tier}
          valueClass={edgeTierColor(edge.tier)}
          detail="Combines conviction, data integrity & risk"
        />
        <KpiCard
          label="Risk grade"
          hint="Red-flag engine"
          value={riskGrade}
          meta={riskScore != null ? `Score ${riskScore}/100` : "—"}
          detail="Lower is safer (A best)"
        />
        <KpiCard
          label="Trend alignment"
          hint="6 indicator checks"
          value={`${bullAlign}/6`}
          meta="Bullish tools"
          valueClass={bullAlign >= 4 ? "text-emerald-400" : bullAlign <= 2 ? "text-red-400" : "text-amber-400"}
          detail="MAs, MACD, stochastic"
        />
        <KpiCard
          label="Data integrity"
          hint="Feed trust"
          value={String(edge.dataIntegrity)}
          meta={edge.dataIntegrity >= 70 ? "Reliable" : "Thin / estimated"}
          valueClass={edge.dataIntegrity >= 70 ? "text-emerald-400" : "text-amber-400"}
          detail="Drives cap on confidence"
        />
      </div>

      <p className="cockpit-section-label">Six factors → overall score</p>
      <div className="cockpit-pillar-scroll">
        {conviction.pillars.map((p) => (
          <article key={p.id} className={`cockpit-pillar-card cockpit-pillar-card--${p.tone}`}>
            <div className="cockpit-pillar-head">
              <span className="cockpit-pillar-name">{p.label}</span>
              <span className="cockpit-pillar-val">{p.score}</span>
            </div>
            <div className="cockpit-pillar-bar">
              <div className="cockpit-pillar-bar-fill" style={{ width: `${p.score}%` }} />
            </div>
            <p className="cockpit-pillar-meta">{p.detail}</p>
            <span className="cockpit-pillar-weight">{(p.weight * 100).toFixed(0)}% of overall</span>
          </article>
        ))}
      </div>

      <details className="cockpit-details">
        <summary className="cockpit-details-summary">
          <span>Deep model</span>
          <span className="cockpit-details-hint">MTF · fusion · drivers</span>
        </summary>
        <div className="cockpit-details-body">
          <div className="cockpit-depth-grid">
            <DepthBlock title="Trend alignment (detail)">
              <div className="cockpit-align-row">
                {conviction.alignment.map((a) => (
                  <span
                    key={a.label}
                    className={`cockpit-align-pill ${a.bullish ? "cockpit-align-pill--up" : "cockpit-align-pill--down"}`}
                  >
                    {a.label}
                  </span>
                ))}
              </div>
            </DepthBlock>
            <DepthBlock title="Multi-timeframe returns">
              <div className="cockpit-mtf-grid">
                {conviction.mtf.map((m) => (
                  <div key={m.label} className="cockpit-mtf-tile">
                    <span className="cockpit-mtf-tag">{m.label}</span>
                    <span className={`cockpit-mtf-pct cockpit-mtf-pct--${m.tone}`}>
                      {m.changePercent >= 0 ? "+" : ""}
                      {m.changePercent.toFixed(2)}%
                    </span>
                  </div>
                ))}
              </div>
            </DepthBlock>
            <DepthBlock title="How Pulse Edge is built">
              {conviction.edgeBlend.map((b) => (
                <div key={b.label} className="cockpit-fusion-row">
                  <span>{b.label}</span>
                  <div className="cockpit-fusion-track">
                    <div style={{ width: `${b.value}%` }} />
                  </div>
                  <span className="cockpit-fusion-num">
                    {b.value} · {(b.weight * 100).toFixed(0)}% weight
                  </span>
                </div>
              ))}
            </DepthBlock>
          </div>
          <div className="cockpit-tactical-box">
            <p className="cockpit-tactical-title">What to do with this</p>
            <p className="cockpit-tactical-body">{conviction.tacticalRead}</p>
            {(edge.drivers.length > 0 || edge.warnings.length > 0) && (
              <div className="cockpit-chips">
                {edge.drivers.map((d) => (
                  <span key={d} className="cockpit-chip cockpit-chip--driver">
                    {d}
                  </span>
                ))}
                {edge.warnings.map((w) => (
                  <span key={w} className="cockpit-chip cockpit-chip--warn">
                    {w}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </details>
    </section>
  );
}

function KpiCard({
  label,
  hint,
  value,
  meta,
  detail,
  valueClass = "text-white",
}: {
  label: string;
  hint: string;
  value: string;
  meta: string;
  detail?: string;
  valueClass?: string;
}) {
  return (
    <div className="cockpit-kpi">
      <span className="cockpit-kpi-label">{label}</span>
      <span className="cockpit-kpi-hint">{hint}</span>
      <span className={`cockpit-kpi-value ${valueClass}`}>{value}</span>
      <span className="cockpit-kpi-meta">{meta}</span>
      {detail ? <span className="cockpit-kpi-detail">{detail}</span> : null}
    </div>
  );
}

function DepthBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="cockpit-depth-block">
      <h4 className="cockpit-depth-title">{title}</h4>
      {children}
    </div>
  );
}

function regimeSlug(regime: string): string {
  return regime.toLowerCase().replace(/\s+/g, "-");
}
