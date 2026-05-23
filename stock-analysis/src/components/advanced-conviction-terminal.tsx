"use client";

import type { ReactNode } from "react";
import type { AdvancedConviction } from "@/lib/conviction-model";
import type { EdgeIndexResult } from "@/lib/edge-index";
import type { SmartScoreResult } from "@/lib/smart-score";
import { edgeTierColor } from "@/lib/edge-index";
import { smartScoreColor } from "@/lib/smart-score";
import { TERMS } from "@/lib/brand";
import { getSignalColor } from "@/lib/utils";
import { ConvictionRing } from "@/components/conviction-ring";

export function AdvancedConvictionTerminal({
  symbol,
  conviction,
  smart,
  signal,
  edge,
  riskGrade,
  riskScore,
}: {
  symbol: string;
  conviction: AdvancedConviction;
  smart: SmartScoreResult;
  signal: string;
  edge: EdgeIndexResult;
  riskGrade: string;
  riskScore?: number;
}) {
  const bullAlign = conviction.alignment.filter((a) => a.bullish).length;

  return (
    <section className="cockpit" aria-label="Pulse conviction cockpit">
      <div className="cockpit-mesh" aria-hidden />
      <header className="cockpit-header">
        <div className="cockpit-header-left">
          <ConvictionRing score={conviction.composite} grade={conviction.grade} />
        </div>
        <div className="cockpit-header-main">
          <p className="cockpit-eyebrow">Pulse conviction model · {symbol}</p>
          <p className={`cockpit-signal ${getSignalColor(signal)}`}>{signal}</p>
          <p className="cockpit-signal-sub">
            {smart.label} · {smart.score} {TERMS.smartScore.toLowerCase()}
          </p>
          <span className={`cockpit-regime cockpit-regime--${regimeSlug(conviction.regime)}`}>
            {conviction.regime}
          </span>
        </div>
      </header>

      <p className="cockpit-regime-copy">{conviction.regimeDetail}</p>

      <div className="cockpit-kpi-scroll">
        <KpiCard
          label={TERMS.edgeShort}
          value={String(edge.edgeScore)}
          meta={edge.tier}
          valueClass={edgeTierColor(edge.tier)}
        />
        <KpiCard label="Risk" value={riskGrade} meta={riskScore != null ? `${riskScore}/100` : "—"} />
        <KpiCard
          label="Alignment"
          value={`${bullAlign}/6`}
          meta="Bullish checks"
          valueClass={bullAlign >= 4 ? "text-emerald-400" : bullAlign <= 2 ? "text-red-400" : "text-amber-400"}
        />
        <KpiCard
          label="Integrity"
          value={String(edge.dataIntegrity)}
          meta="Data quality"
          valueClass={edge.dataIntegrity >= 70 ? "text-emerald-400" : "text-amber-400"}
        />
      </div>

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
          </article>
        ))}
      </div>

      <details className="cockpit-details">
        <summary className="cockpit-details-summary">
          <span>Institutional depth</span>
          <span className="cockpit-details-hint">MTF · fusion · drivers</span>
        </summary>
        <div className="cockpit-details-body">
          <div className="cockpit-depth-grid">
            <DepthBlock title="Trend alignment">
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
            <DepthBlock title="Multi-timeframe">
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
            <DepthBlock title={`${TERMS.edgeIndex} fusion`}>
              {conviction.edgeBlend.map((b) => (
                <div key={b.label} className="cockpit-fusion-row">
                  <span>{b.label}</span>
                  <div className="cockpit-fusion-track">
                    <div style={{ width: `${b.value}%` }} />
                  </div>
                  <span className="cockpit-fusion-num">{b.value}</span>
                </div>
              ))}
            </DepthBlock>
          </div>
          <div className="cockpit-tactical-box">
            <p className="cockpit-tactical-title">Tactical posture</p>
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
  value,
  meta,
  valueClass = "text-white",
}: {
  label: string;
  value: string;
  meta: string;
  valueClass?: string;
}) {
  return (
    <div className="cockpit-kpi">
      <span className="cockpit-kpi-label">{label}</span>
      <span className={`cockpit-kpi-value ${valueClass}`}>{value}</span>
      <span className="cockpit-kpi-meta">{meta}</span>
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
