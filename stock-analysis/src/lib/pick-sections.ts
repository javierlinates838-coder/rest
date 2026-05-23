import type { StockPick } from "@/lib/stock-recommendations";

type PickSorter = (a: StockPick, b: StockPick) => number;

function takeUnique(
  picks: StockPick[],
  used: Set<string>,
  limit: number,
  sort: PickSorter
): StockPick[] {
  const out: StockPick[] = [];
  for (const p of [...picks].sort(sort)) {
    const sym = p.symbol.toUpperCase();
    if (used.has(sym)) continue;
    used.add(sym);
    out.push(p);
    if (out.length >= limit) break;
  }
  return out;
}

/** Each ticker appears in at most one Meridian picks column. */
export function buildExclusivePickSections(picks: StockPick[]): {
  topBuys: StockPick[];
  qualityPicks: StockPick[];
  momentumPicks: StockPick[];
} {
  const used = new Set<string>();
  const byScore = (a: StockPick, b: StockPick) => b.score - a.score;
  const byMomentum = (a: StockPick, b: StockPick) => b.changePercent - a.changePercent;

  let topBuys = takeUnique(
    picks.filter((p) => p.signal.includes("Buy") && p.confidence >= 40),
    used,
    5,
    byScore
  );

  let momentumPicks = takeUnique(
    picks.filter((p) => p.changePercent > 0.5 && !p.signal.includes("Sell")),
    used,
    5,
    byMomentum
  );

  let qualityPicks = takeUnique(
    picks.filter((p) => (p.riskGrade === "A" || p.riskGrade === "B") && !p.signal.includes("Sell")),
    used,
    5,
    byScore
  );

  if (topBuys.length === 0) {
    topBuys = takeUnique(picks, used, 3, byScore);
  }
  if (momentumPicks.length === 0) {
    momentumPicks = takeUnique(picks, used, 3, byMomentum);
  }
  if (qualityPicks.length === 0) {
    qualityPicks = takeUnique(
      picks.filter((p) => p.riskGrade === "C" || p.riskGrade === "B"),
      used,
      3,
      byScore
    );
  }

  return { topBuys, qualityPicks, momentumPicks };
}
