"use client";

import { SCORE_GUIDE, type ScoreKey } from "@/lib/score-guide";

export function ScoreTip({ id }: { id: ScoreKey }) {
  const g = SCORE_GUIDE[id];
  return (
    <span className="score-tip" title={g.detail}>
      <span className="score-tip-label">{g.title}</span>
      <span className="score-tip-hint">{g.short}</span>
    </span>
  );
}

export function ScoreLegend({ open = false }: { open?: boolean }) {
  return (
    <details className="score-legend" open={open}>
      <summary className="score-legend-summary">Score definitions</summary>
      <ul className="score-legend-list">
        {(Object.keys(SCORE_GUIDE) as ScoreKey[])
          .filter((k) => k !== "pillar")
          .map((k) => {
            const g = SCORE_GUIDE[k];
            return (
              <li key={k}>
                <strong>{g.title}</strong>
                <span className="score-legend-short">{g.short}</span>
                <p>{g.detail}</p>
              </li>
            );
          })}
      </ul>
    </details>
  );
}

export function ScoreHierarchyStrip({
  composite,
  grade,
  signal,
  confidence,
  smartScore,
  smartLabel,
  edgeScore,
  edgeTier,
}: {
  composite: number;
  grade: string;
  signal: string;
  confidence: number;
  smartScore: number;
  smartLabel: string;
  edgeScore: number;
  edgeTier: string;
}) {
  const disagree =
    (smartLabel.includes("Buy") && /sell/i.test(signal)) ||
    (smartLabel.includes("Sell") && /buy/i.test(signal));

  const rows = [
    { label: "Overall", value: `${composite} (${grade})`, primary: true },
    { label: "Signal", value: `${signal}, ${confidence}% conf` },
    { label: SCORE_GUIDE.smart.title, value: `${smartScore} · ${smartLabel}` },
    { label: SCORE_GUIDE.edge.title, value: `${edgeScore} · ${edgeTier}` },
  ];

  return (
    <div className="score-hierarchy">
      {rows.map((row) => (
        <div
          key={row.label}
          className={row.primary ? "score-hierarchy-primary" : "score-hierarchy-row"}
        >
          <span className="score-hierarchy-name">{row.label}</span>
          <span className="score-hierarchy-val">{row.value}</span>
        </div>
      ))}
      {disagree && (
        <p className="score-hierarchy-warn">Signal and conviction score diverge. Weight the overall score.</p>
      )}
    </div>
  );
}
