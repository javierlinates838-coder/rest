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
      <summary className="score-legend-summary">How to read these scores</summary>
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
      <p className="score-legend-foot">
        Overall Pulse Score (ring) = weighted pillars. Pulse Edge = fused trade-quality index. Technical
        signal = what indicators say right now; they can disagree when data is limited.
      </p>
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

  return (
    <div className="score-hierarchy">
      <div className="score-hierarchy-primary">
        <span className="score-hierarchy-rank">1</span>
        <div>
          <span className="score-hierarchy-name">Overall Pulse Score</span>
          <span className="score-hierarchy-val">
            {composite} <span className="text-zinc-500">({grade})</span>
          </span>
        </div>
      </div>
      <div className="score-hierarchy-row">
        <span className="score-hierarchy-rank">2</span>
        <div>
          <span className="score-hierarchy-name">Technical signal</span>
          <span className="score-hierarchy-val">
            {signal} · {confidence}% confidence
          </span>
        </div>
      </div>
      <div className="score-hierarchy-row">
        <span className="score-hierarchy-rank">3</span>
        <div>
          <span className="score-hierarchy-name">{SCORE_GUIDE.smart.title}</span>
          <span className="score-hierarchy-val">
            {smartScore} → {smartLabel}
          </span>
        </div>
      </div>
      <div className="score-hierarchy-row">
        <span className="score-hierarchy-rank">4</span>
        <div>
          <span className="score-hierarchy-name">{SCORE_GUIDE.edge.title}</span>
          <span className="score-hierarchy-val">
            {edgeScore} · {edgeTier}
          </span>
        </div>
      </div>
      {disagree && (
        <p className="score-hierarchy-warn">
          Signal and model tilt disagree — treat the Overall Pulse Score as the blend, not either label alone.
        </p>
      )}
    </div>
  );
}
