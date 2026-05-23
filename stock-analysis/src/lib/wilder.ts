/** Wilder smoothing (RMA) used by RSI, ATR, and ADX. */

export function wilderSmooth(values: number[], period: number): number[] {
  if (values.length < period || period < 1) return [];
  let sum = 0;
  for (let i = 0; i < period; i++) sum += values[i];
  let prev = sum / period;
  const out: number[] = [prev];
  for (let i = period; i < values.length; i++) {
    prev = (prev * (period - 1) + values[i]) / period;
    out.push(prev);
  }
  return out;
}

export function lastWilder(values: number[], period: number): number {
  const smoothed = wilderSmooth(values, period);
  return smoothed.length > 0 ? smoothed[smoothed.length - 1] : 0;
}
