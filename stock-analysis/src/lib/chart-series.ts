export type ChartPoint = {
  date: string;
  price: number;
  volume: number;
  sma20: number;
  sma50: number;
};

/** O(n) rolling SMA — safe to call on every history update. */
export function buildChartSeries(
  history: { date: string; close: number; volume: number }[]
): ChartPoint[] {
  if (history.length === 0) return [];

  const points: ChartPoint[] = history.map((h) => ({
    date: h.date,
    price: h.close,
    volume: h.volume,
    sma20: 0,
    sma50: 0,
  }));

  let sum20 = 0;
  let sum50 = 0;
  for (let i = 0; i < points.length; i++) {
    sum20 += points[i].price;
    if (i >= 20) sum20 -= points[i - 20].price;
    if (i >= 19) points[i].sma20 = sum20 / 20;

    sum50 += points[i].price;
    if (i >= 50) sum50 -= points[i - 50].price;
    if (i >= 49) points[i].sma50 = sum50 / 50;
  }

  return points;
}
